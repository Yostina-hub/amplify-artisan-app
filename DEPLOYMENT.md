# Self-Hosted Deployment Guide

This guide explains how to deploy this application on your own VPS with automatic database setup.

## Prerequisites

- Linux VPS (Ubuntu 22.04 LTS recommended)
- Node.js 20+ installed
- PostgreSQL 14+ installed
- Git installed

## Quick Start (Automatic Setup)

### 1. Install PostgreSQL

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```bash
# Switch to postgres user and create database
sudo -u postgres psql << EOF
CREATE DATABASE social_media_app;
CREATE USER app_user WITH PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE social_media_app TO app_user;
\c social_media_app
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
GRANT ALL ON SCHEMA public TO app_user;
ALTER DATABASE social_media_app OWNER TO app_user;
EOF
```

### 3. Clone Repository

```bash
# Clone your GitHub repository
git clone https://github.com/yourusername/yourrepo.git
cd yourrepo

# Install dependencies
npm install
```

### 4. Configure Environment

```bash
# Copy example environment file
cp .env.local.example .env.local

# Edit with your database credentials
nano .env.local
```

Update `.env.local`:
```bash
DATABASE_URL=postgresql://app_user:YourStrongPassword123!@localhost:5432/social_media_app
```

### 5. Run Database Migration (Automatic!)

```bash
# Run the migration script - this creates all tables automatically
npm run migrate

# You should see:
# ✅ Connected to database
# 🚀 Running database migration...
# ✅ Database migration completed successfully!
```

### 6. Build and Run

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

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Restart nginx
sudo systemctl restart nginx
```

## Updating Your Application

When you update your code:

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Run migrations (safe to run multiple times)
npm run migrate

# Rebuild frontend
npm run build

# Copy to nginx (if using)
sudo cp -r dist/* /var/www/html/
```

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

## Setting Up First Admin User

After deployment, you'll need to manually create your first admin user in the database:

```bash
# Connect to database
psql -U app_user -d social_media_app

# Create admin role for your user (replace user_id with actual UUID)
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-uuid-here', 'admin');
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

## Need Help?

- Check application logs: `journalctl -u nginx -f`
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
- Database connection issues: Verify DATABASE_URL in `.env.local`
