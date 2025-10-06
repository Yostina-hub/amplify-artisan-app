#!/bin/bash

# CRM Platform VPS Deployment Script
# Run this script on your VPS as root or sudo user

set -e

echo "=================================="
echo "CRM Platform VPS Deployment"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root or with sudo"
    exit 1
fi

# Prompt for domain information
echo "Enter your domain name (e.g., example.com):"
read DOMAIN
echo ""
echo "Enter your email for SSL certificates:"
read EMAIL
echo ""

# Generate secure passwords
print_status "Generating secure passwords..."
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_status "Docker installed successfully"
else
    print_status "Docker already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt install -y docker-compose-plugin
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose already installed"
fi

# Install Node.js
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    print_status "Node.js installed successfully"
else
    print_status "Node.js already installed"
fi

# Install PostgreSQL client
print_status "Installing PostgreSQL client..."
apt install -y postgresql-client

# Install Nginx
print_status "Installing Nginx..."
apt install -y nginx

# Install Certbot for SSL
print_status "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Install PM2
print_status "Installing PM2..."
npm install -g pm2

# Create application directory
APP_DIR="/var/www/crm"
print_status "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR
cd $APP_DIR

# Check if git repo exists, otherwise prompt for clone
if [ -d ".git" ]; then
    print_status "Pulling latest changes..."
    git pull origin main || git pull origin master
else
    echo "Enter your Git repository URL:"
    read REPO_URL
    print_status "Cloning repository..."
    git clone $REPO_URL .
fi

# Generate JWT keys
print_status "Generating JWT keys..."
npm install -g jwt-cli

ANON_KEY=$(jwt sign '{"role":"anon","iss":"supabase","iat":1641769200,"exp":1799535600}' --secret="$JWT_SECRET" --algorithm=HS256)
SERVICE_ROLE_KEY=$(jwt sign '{"role":"service_role","iss":"supabase","iat":1641769200,"exp":1799535600}' --secret="$JWT_SECRET" --algorithm=HS256)

# Create Docker environment file
print_status "Creating Docker environment file..."
cat > .env.docker << EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=3600
API_EXTERNAL_URL=https://api.$DOMAIN
SITE_URL=https://$DOMAIN
ADDITIONAL_REDIRECT_URLS=
DISABLE_SIGNUP=false
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
SMTP_ADMIN_EMAIL=$EMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_NAME=CRM Platform
MAILER_URLPATHS_INVITE=/auth/v1/verify
MAILER_URLPATHS_CONFIRMATION=/auth/v1/verify
MAILER_URLPATHS_RECOVERY=/auth/v1/verify
MAILER_URLPATHS_EMAIL_CHANGE=/auth/v1/verify
PGRST_DB_SCHEMAS=public,storage,graphql_public
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
EOF

# Update Kong configuration with new keys
print_status "Updating Kong configuration..."
sed -i "s|key: .*# ANON|key: $ANON_KEY|g" supabase/kong.yml
sed -i "s|key: .*# SERVICE|key: $SERVICE_ROLE_KEY|g" supabase/kong.yml

# Create frontend environment file
print_status "Creating frontend environment file..."
cat > .env << EOF
VITE_SUPABASE_URL=https://api.$DOMAIN
VITE_SUPABASE_ANON_KEY=$ANON_KEY
VITE_API_URL=https://api.$DOMAIN/api
EOF

# Create backend environment file
print_status "Creating backend environment file..."
cat > backend/.env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/postgres
SUPABASE_URL=https://api.$DOMAIN
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=https://$DOMAIN
EOF

# Start Docker services
print_status "Starting Docker services..."
docker-compose --env-file .env.docker up -d

# Wait for services to be ready
print_status "Waiting for services to initialize (60 seconds)..."
sleep 60

# Initialize database
print_status "Initializing database..."
chmod +x scripts/init-db.sh
sed -i "s/your-super-secret-and-long-postgres-password/$POSTGRES_PASSWORD/g" scripts/init-db.sh
./scripts/init-db.sh

# Install and build backend
print_status "Building backend..."
cd backend
npm install
npm run build
pm2 start dist/main.js --name "crm-backend"
pm2 save
cd ..

# Install and build frontend
print_status "Building frontend..."
npm install
npm run build
pm2 serve dist 5173 --name "crm-frontend" --spa
pm2 save

# Configure PM2 startup
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

# Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/crm << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name api.$DOMAIN;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Get SSL certificates
print_status "Obtaining SSL certificates..."
certbot --nginx -d $DOMAIN -d api.$DOMAIN --non-interactive --agree-tos --email $EMAIL

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Save credentials
print_status "Saving credentials..."
cat > /root/crm-credentials.txt << EOF
================================
CRM Platform Credentials
================================

Domain: https://$DOMAIN
API: https://api.$DOMAIN

Database:
- Host: localhost
- Port: 5432
- User: postgres
- Password: $POSTGRES_PASSWORD

Supabase:
- Anon Key: $ANON_KEY
- Service Role Key: $SERVICE_ROLE_KEY

JWT Secret: $JWT_SECRET

Supabase Studio: http://$DOMAIN:3000
(Access only via SSH tunnel for security)

To create SSH tunnel:
ssh -L 3000:localhost:3000 root@YOUR_SERVER_IP

================================
KEEP THIS FILE SECURE!
================================
EOF

chmod 600 /root/crm-credentials.txt

echo ""
echo "=================================="
print_status "Deployment completed successfully!"
echo "=================================="
echo ""
echo "Your CRM is now available at:"
echo "  Frontend: https://$DOMAIN"
echo "  API: https://api.$DOMAIN"
echo ""
echo "Credentials saved to: /root/crm-credentials.txt"
echo ""
print_warning "Next steps:"
echo "  1. Create your first admin user:"
echo "     Visit: https://$DOMAIN"
echo "  2. Or create via database:"
echo "     PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U postgres -d postgres"
echo ""
echo "Useful commands:"
echo "  - View logs: pm2 logs"
echo "  - Restart services: pm2 restart all"
echo "  - Docker logs: docker-compose logs -f"
echo "  - Database backup: docker exec crm_postgres pg_dump -U postgres postgres > backup.sql"
echo ""
print_status "Deployment complete!"
