# VPS Quick Deploy Guide

## Prerequisites

1. **VPS Requirements:**
   - Ubuntu 20.04 or 22.04
   - Minimum 2GB RAM (4GB recommended)
   - Root or sudo access
   - Clean installation

2. **Domain Setup:**
   - Point your domain A record to VPS IP: `example.com → YOUR_VPS_IP`
   - Point API subdomain: `api.example.com → YOUR_VPS_IP`
   - Wait for DNS propagation (5-30 minutes)

3. **Local Setup:**
   - Push your code to a Git repository (GitHub, GitLab, etc.)

## Method 1: Automated One-Command Deploy

### Step 1: Upload to VPS

```bash
# On your local machine
scp scripts/deploy-vps.sh root@YOUR_VPS_IP:/root/
```

### Step 2: Run on VPS

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Run the deployment script
chmod +x deploy-vps.sh
./deploy-vps.sh
```

The script will ask for:
- Your domain name
- Your email for SSL
- Your Git repository URL

Then it automatically:
- Installs all dependencies (Docker, Node.js, Nginx, etc.)
- Clones your repository
- Generates secure passwords and JWT keys
- Configures everything
- Sets up SSL certificates
- Starts all services

**Total time: 5-10 minutes**

### Step 3: Create Admin User

```bash
# After deployment completes, create your first user
curl -X POST https://api.example.com/auth/v1/signup \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }'
```

Your credentials are saved in `/root/crm-credentials.txt`

## Method 2: Manual Step-by-Step

If you prefer manual control:

### 1. Connect to VPS

```bash
ssh root@YOUR_VPS_IP
```

### 2. Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install other tools
apt install -y nginx certbot python3-certbot-nginx postgresql-client git

# Install PM2
npm install -g pm2
```

### 3. Clone Your Repository

```bash
mkdir -p /var/www/crm
cd /var/www/crm
git clone YOUR_REPO_URL .
```

### 4. Generate Secrets

```bash
# Generate passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Generate JWT keys
npm install -g jwt-cli
ANON_KEY=$(jwt sign '{"role":"anon","iss":"supabase"}' --secret="$JWT_SECRET" --algorithm=HS256)
SERVICE_ROLE_KEY=$(jwt sign '{"role":"service_role","iss":"supabase"}' --secret="$JWT_SECRET" --algorithm=HS256)

# Save them
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" > /root/secrets.txt
echo "JWT_SECRET=$JWT_SECRET" >> /root/secrets.txt
echo "ANON_KEY=$ANON_KEY" >> /root/secrets.txt
echo "SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> /root/secrets.txt
```

### 5. Configure Environment Files

Create `.env.docker`:

```bash
cat > .env.docker << 'EOF'
POSTGRES_PASSWORD=REPLACE_WITH_YOUR_PASSWORD
JWT_SECRET=REPLACE_WITH_YOUR_JWT_SECRET
JWT_EXPIRY=3600
API_EXTERNAL_URL=https://api.yourdomain.com
SITE_URL=https://yourdomain.com
ANON_KEY=REPLACE_WITH_YOUR_ANON_KEY
SERVICE_ROLE_KEY=REPLACE_WITH_YOUR_SERVICE_ROLE_KEY
# ... rest from .env.docker template
EOF
```

Replace placeholders with values from `/root/secrets.txt`

### 6. Start Services

```bash
# Start Docker
docker-compose --env-file .env.docker up -d

# Wait for initialization
sleep 60

# Initialize database
chmod +x scripts/init-db.sh
./scripts/init-db.sh

# Start backend
cd backend
npm install
npm run build
pm2 start dist/main.js --name crm-backend
cd ..

# Start frontend
npm install
npm run build
pm2 serve dist 5173 --name crm-frontend --spa
pm2 save
pm2 startup
```

### 7. Configure Nginx

```bash
# Create Nginx config (see deployment script for full config)
nano /etc/nginx/sites-available/crm

# Enable site
ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and restart
nginx -t
systemctl restart nginx
```

### 8. Get SSL Certificates

```bash
certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### 9. Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Post-Deployment

### Access Your Application

- **Frontend:** https://yourdomain.com
- **API:** https://api.yourdomain.com
- **Supabase Studio:** SSH tunnel only (security)

### Create First User

```bash
# Method 1: Via signup endpoint
curl -X POST https://api.yourdomain.com/auth/v1/signup \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePass123!"}'

# Method 2: Direct database
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U postgres -d postgres
```

### Verify Services

```bash
# Check Docker containers
docker-compose ps

# Check PM2 processes
pm2 status

# Check Nginx
systemctl status nginx

# View logs
pm2 logs
docker-compose logs -f
```

## Troubleshooting

### Services Not Starting

```bash
# Check Docker logs
docker-compose logs postgres
docker-compose logs auth

# Restart services
docker-compose restart
pm2 restart all
```

### SSL Certificate Issues

```bash
# Check domain DNS
nslookup yourdomain.com
nslookup api.yourdomain.com

# Manually get certificate
certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
```

### Can't Access Application

```bash
# Check firewall
ufw status

# Check if ports are listening
netstat -tlnp | grep -E '80|443|5000|5173|8000'

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

### Database Connection Issues

```bash
# Test database
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U postgres -d postgres -c "SELECT 1"

# Check if container is running
docker-compose ps postgres
```

## Updating Your Application

```bash
cd /var/www/crm

# Pull latest changes
git pull origin main

# Rebuild backend
cd backend
npm install
npm run build
pm2 restart crm-backend
cd ..

# Rebuild frontend
npm install
npm run build
pm2 restart crm-frontend

# Restart Docker if needed
docker-compose restart
```

## Backup Your Data

```bash
# Database backup
docker exec crm_postgres pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql

# Automate with cron
crontab -e
# Add: 0 2 * * * docker exec crm_postgres pg_dump -U postgres postgres > /backups/backup_$(date +\%Y\%m\%d).sql
```

## Security Checklist

- [ ] Strong passwords generated
- [ ] SSL certificates active
- [ ] Firewall configured
- [ ] Root SSH disabled (use key-based auth)
- [ ] Regular backups enabled
- [ ] Monitoring set up
- [ ] Supabase Studio only via SSH tunnel

## Support Commands

```bash
# View all logs
pm2 logs

# Docker logs
docker-compose logs -f

# System resources
htop
docker stats

# Database shell
PGPASSWORD=YOUR_PASSWORD psql -h localhost -U postgres -d postgres

# Restart everything
docker-compose restart
pm2 restart all
systemctl restart nginx
```

## Need Help?

Common issues:
1. **"Connection refused"** - Check if services are running with `pm2 status` and `docker-compose ps`
2. **"502 Bad Gateway"** - Backend not running, check `pm2 logs crm-backend`
3. **"Database connection failed"** - Check password in backend/.env matches .env.docker
4. **"SSL certificate error"** - DNS not propagated yet, wait 30 minutes and retry

---

Your CRM should now be live and accessible!
