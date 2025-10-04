# Deployment Guide

## ⚠️ IMPORTANT: Two Separate Deployment Paths

This application has **TWO DIFFERENT** deployment configurations that **CANNOT be mixed**:

### 🌟 Option 1: Lovable Cloud (Current Setup - Default)
- ✅ **YOU ARE CURRENTLY USING THIS**
- Fully managed Supabase backend
- Already configured and working
- **DO NOT run `npm run migrate`** - it will cause errors!
- Use Lovable's Supabase migration tool via the UI

### 🛠️ Option 2: Self-Hosted Local Deployment  
- For deploying on your own VPS/server
- Requires manual PostgreSQL setup
- Uses `npm run migrate` script
- **Only use if you want to move OFF Lovable Cloud**

---

## 🚀 Which Mode Am I Using?

Check your `.env` or `.env.local` file:

**Lovable Cloud** (current):
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJh...
```

**Self-Hosted**:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

---

## 📋 For Current Users (Lovable Cloud)

You're already set up! Your database migrations are handled via:
1. Lovable UI → Database tools
2. Automatic deployment when you push changes

**DO NOT:**
- ❌ Run `npm run migrate` 
- ❌ Edit `DATABASE_URL` in .env
- ❌ Use `setup-auth.sql` script

**These will break your Lovable Cloud setup!**

---

# 🏠 Self-Hosted Local Deployment (Advanced)

## ⚠️ WARNING: Only For New Local Deployments

**This section is ONLY for users who want to:**
- Deploy on their own VPS/server
- Move completely OFF Lovable Cloud  
- Have full infrastructure control

**If you're currently using Lovable Cloud, DO NOT follow these steps!**

---

## Prerequisites

- **Linux VPS** (Ubuntu 22.04 LTS recommended)
- **Node.js 20+** and npm
- **Docker & Docker Compose** (for Supabase)
- **Nginx** (web server and reverse proxy)
- **PM2** (process manager - optional but recommended)
- **Certbot** (for SSL/HTTPS - optional but recommended)
- **Git**
- Domain name (optional, for production with SSL)

## Quick Start (Automatic Setup with Supabase CLI)

### 1. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node version
node --version  # Should be v20.x.x or higher

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally (process manager)
sudo npm install -g pm2

# Install Certbot for SSL (optional, for production with domain)
sudo apt install -y certbot python3-certbot-nginx

# Install Supabase CLI
npm install -g supabase

# Verify installations
supabase --version
nginx -v
pm2 --version
```

### 2. Initialize Supabase Locally

```bash
# Initialize Supabase in your project
cd /path/to/your/project
supabase init

# Start Supabase (this starts PostgreSQL, Auth, Storage, etc.)
supabase start

# You'll see output like:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# anon key: eyJh... (long key)
# service_role key: eyJh... (long key)

# Copy these values - you'll need them!
```

### 3. Clone Repository

```bash
# Clone your GitHub repository
git clone https://github.com/yourusername/yourrepo.git
cd yourrepo

# Install dependencies
npm install
```

### 4. Configure Environment (Automatic Detection!)

```bash
# Copy example environment file
cp .env.local.example .env.local

# Edit with your LOCAL Supabase credentials
nano .env.local
```

Update `.env.local` with the values from `supabase start`:
```bash
# Comment out Lovable Cloud settings
# VITE_SUPABASE_URL=https://kdqibmhpebndlmzjhuvf.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=eyJh...

# Add your local Supabase settings
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJh... # (use anon key from supabase start)
```

### 5. Run Database Migration

```bash
# Link your migrations to Supabase
supabase db push

# Or apply the migration file directly:
supabase db reset

# You should see:
# ✅ Database migrated successfully
# ✅ All tables and functions created
```

### 6. Build and Run (App Auto-Detects Environment!)

```bash
# Build the frontend
npm run build

# Option 1: Run with Node.js (development)
npm run preview

# Option 2: Serve with Nginx (production)
# Install nginx
sudo apt install -y nginx

# Copy build to nginx directory
sudo cp -r dist/* /var/www/html/

# Configure nginx
sudo nano /etc/nginx/sites-available/default
```

Create production Nginx configuration:

```bash
# Create app directory
sudo mkdir -p /var/www/socialhub

# Copy built files
sudo cp -r dist/* /var/www/socialhub/

# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/socialhub
```

Add this production-ready Nginx configuration:

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m use_temp_path=off;

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain or server IP
    
    root /var/www/socialhub;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json application/xml 
               image/svg+xml;
    
    # Main SPA location - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
        
        # Additional headers for HTML
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # Cache static assets aggressively
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Proxy to local Supabase instance
    location /supabase/ {
        proxy_pass http://localhost:54321/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

Enable the site and restart Nginx:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 7. Setup SSL Certificate (Production Only)

If you have a domain name, secure it with SSL:

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts - Certbot will automatically:
# - Obtain the certificate
# - Configure Nginx for HTTPS
# - Set up auto-renewal

# Test auto-renewal
sudo certbot renew --dry-run

# Certificate will auto-renew every 90 days
```

### 8. Setup PM2 for Process Management (Optional but Recommended)

Keep Supabase and other services running automatically:

```bash
# Create PM2 ecosystem configuration
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'supabase',
      script: 'supabase',
      args: 'start',
      cwd: '/path/to/your/project',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
EOF

# Start services with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Check status
pm2 status

# View logs
pm2 logs supabase
```

### 9. Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 🔄 Updating Your Application

The app automatically adapts to your environment:

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Apply new migrations
supabase db push

# Rebuild frontend
npm run build

# Copy to nginx
sudo cp -r dist/* /var/www/socialhub/

# Restart Nginx
sudo systemctl restart nginx

# Restart PM2 services if using
pm2 restart all
```

## 🔀 Switching Between Environments

To switch from Lovable Cloud to Self-Hosted (or vice versa):

```bash
# Edit .env.local
nano .env.local

# For Lovable Cloud: Use VITE_SUPABASE_URL with https://
# For Self-Hosted: Use VITE_SUPABASE_URL with http://localhost:54321

# Restart the app - it auto-detects the change!
npm run dev
```

**That's it!** No code changes required - the app automatically uses the correct backend.

## Troubleshooting

### Migration Fails

If migration fails with "table already exists":
```bash
# This is normal if database was already set up
# You can safely ignore this error
```

### Connection Refused

Check PostgreSQL is running:
```bash
sudo systemctl status postgresql

# If not running:
sudo systemctl start postgresql
```

### Permission Denied

Grant permissions:
```bash
sudo -u postgres psql -d social_media_app
GRANT ALL ON SCHEMA public TO app_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

## ⚠️ IMPORTANT: Authentication Setup

**NOTE**: The migration script automatically creates the auth schema and `auth.uid()` function for self-hosted environments. This happens automatically when you run `npm run migrate`.

The auth schema includes:
- `auth.users` table for user authentication
- `auth.uid()` function for Row Level Security policies
- Necessary permissions for database operations

### Using Authentication in Your Application

For session-based auth, set the user context before database operations:

```javascript
// Set user context before database operations
await client.query('SET app.current_user_id = $1', [userId]);
```

For JWT-based auth, configure your application to pass JWT claims through PostgreSQL settings.

## Setting Up First Admin User

After deployment, create your first admin user:

```bash
# 1. Connect to database
psql -U app_user -d social_media_app

# 2. First, create a user account in your app's signup flow
# 3. Then add admin role in database:
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-uuid-here', 'admin');

# To find your user UUID after signup:
SELECT id, email FROM profiles;
```

## Security Recommendations

1. **Change default passwords** immediately after setup
2. **Enable firewall**:
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

3. **Set up SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

4. **Restrict PostgreSQL access** (edit `/etc/postgresql/*/main/pg_hba.conf`)

## Monitoring & Logs

### Check Service Status
```bash
# Nginx status
sudo systemctl status nginx

# Supabase (if using PM2)
pm2 status
pm2 logs supabase

# Docker containers (Supabase)
docker ps
docker logs supabase_db
```

### View Logs
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Supabase logs (via PM2)
pm2 logs supabase --lines 100

# Docker logs
docker logs -f supabase_db
```

## Performance Optimization

### Enable HTTP/2 (After SSL setup)
```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/socialhub

# Change listen directives to:
# listen 443 ssl http2;
# listen [::]:443 ssl http2;

sudo systemctl restart nginx
```

### Setup Log Rotation
```bash
# Nginx logs are rotated automatically
# Check configuration:
cat /etc/logrotate.d/nginx
```

## Need Help?

- **Nginx issues**: `sudo nginx -t` to test configuration
- **Application logs**: `sudo tail -f /var/log/nginx/error.log`
- **Supabase logs**: `pm2 logs supabase` or `docker logs supabase_db`
- **Database connection**: Verify VITE_SUPABASE_URL in `.env.local`
- **SSL issues**: `sudo certbot certificates` to check SSL status
