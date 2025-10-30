# SocialHub Platform - Complete Deployment Guide

## Overview

This guide covers deploying the SocialHub platform in both **Lovable Cloud** (managed) and **VPS Self-Hosted** (self-managed) environments.

---

## 🚀 Quick Start (Recommended: Lovable Cloud)

### Default Admin Credentials
```
Email: abel.birara@gmail.com
Password: Admin@2025
```
⚠️ **CRITICAL**: Change password immediately after first login!

---

## Deployment Mode 1: Lovable Cloud (Managed)

### Prerequisites
- Active Lovable account
- Project access

### Setup Steps

1. **Access the Platform**
   - Navigate to your Lovable dashboard
   - The database and backend are pre-configured
   - No manual database setup required

2. **Deploy Application**
   ```bash
   # Automatic deployment via Lovable interface
   # No manual steps required
   ```

3. **Access Admin Panel**
   - Visit your deployed URL
   - Login with default credentials
   - Change password in Settings

4. **Configure Social Media OAuth (Centralized)**
   - Login as super admin
   - Navigate to: Admin → System Configuration → Platform OAuth Apps
   - Add OAuth credentials for each platform:
     * **Facebook**: [Get credentials](https://developers.facebook.com/)
     * **Twitter/X**: [Get credentials](https://developer.twitter.com/)
     * **LinkedIn**: [Get credentials](https://www.linkedin.com/developers/)
     * **Instagram**: [Get credentials](https://developers.facebook.com/)
     * **TikTok**: [Get credentials](https://developers.tiktok.com/)

### Centralized OAuth Setup Flow

1. **Super Admin Configuration** (One-time setup)
   ```
   Admin Panel → Platform OAuth Apps → Add New Platform
   - Select Platform (e.g., Facebook)
   - Enter Client ID
   - Enter Client Secret
   - Enter Redirect URI
   - Save
   ```

2. **User Connection Flow**
   ```
   User Dashboard → Social Media Credentials → Connect Account
   - Click "Connect [Platform]"
   - User is redirected to platform for authorization
   - Platform uses super admin's OAuth app
   - User's access token is saved to their account
   - User can now publish to their connected account
   ```

3. **Company Override (Optional)**
   ```
   Company Settings → Social Platform Settings
   - Toggle OFF "Use Platform OAuth"
   - Enter company's own OAuth credentials
   - Now company uses their own OAuth app instead
   ```

---

## Deployment Mode 2: VPS Self-Hosted

### Prerequisites
- Ubuntu 20.04+ or Debian 11+
- 2GB+ RAM
- Node.js 18+
- PostgreSQL 14+
- Nginx
- Domain with SSL certificate
- Supabase account

### Complete Installation

#### 1. Prepare VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx certbot python3-certbot-nginx git

# Verify installations
node --version  # Should be 18+
psql --version  # Should be 14+
```

#### 2. Setup Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE socialhub;
CREATE USER socialhub_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE socialhub TO socialhub_user;
\q
```

#### 3. Clone and Configure Project

```bash
# Clone repository
git clone https://github.com/yourusername/socialhub.git
cd socialhub

# Create environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

#### 4. Configure Environment Variables

Create `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://socialhub_user:your_password@localhost:5432/socialhub

# Supabase (get these from your Supabase project)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id

# Application
VITE_APP_URL=https://yourdomain.com
NODE_ENV=production
```

#### 5. Run Complete Database Migration

```bash
# Connect to database
psql -U socialhub_user -d socialhub

# Run complete migration
\i supabase/migrations/complete_migration.sql

# Verify tables created
\dt

# Exit
\q
```

#### 6. Create Super Admin User

```bash
# Run admin seed script
psql -U socialhub_user -d socialhub -f scripts/seed-admin.sql
```

Or manually:

```sql
-- Insert into auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
    gen_random_uuid(),
    'abel.birara@gmail.com',
    crypt('Admin@2025', gen_salt('bf')),
    now()
);

-- Insert into profiles
INSERT INTO profiles (id, full_name)
SELECT id, 'Super Admin'
FROM auth.users
WHERE email = 'abel.birara@gmail.com';

-- Assign admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'abel.birara@gmail.com';
```

#### 7. Build and Deploy Frontend

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# The build output is in /dist folder
```

#### 8. Configure Nginx

Create `/etc/nginx/sites-available/socialhub`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/socialhub/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 9. Setup Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Deploy all edge functions
supabase functions deploy
```

#### 10. Configure Supabase Auth

In your Supabase Dashboard:

1. **Authentication → URL Configuration**
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/auth/callback`

2. **Authentication → Email**
   - Enable email provider
   - Disable email confirmation for development
   - Enable for production after SMTP setup

3. **Authentication → Providers** (Optional)
   - Configure Google, GitHub, etc. if needed

---

## 🔐 Security Configuration

### Immediate Actions (First 30 Minutes)

1. **Change Default Password**
   ```
   Login → Settings → Change Password
   ```

2. **Enable Two-Factor Authentication** (if available)

3. **Review User Roles**
   ```
   Admin Panel → User Management
   ```

### Lovable Cloud Security

- ✅ Database automatically secured
- ✅ SSL/TLS enabled by default
- ✅ Automatic backups
- ✅ DDoS protection included

**Recommended:**
- Configure API rate limiting
- Enable audit logging
- Set up monitoring alerts

### VPS Security Checklist

```bash
# 1. Setup firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# 2. Secure PostgreSQL
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Change: local all all peer
# To: local all all md5

# 3. Disable root SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd

# 4. Setup automatic updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades

# 5. Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

---

## 👥 User Management

### Regular User Signup Flow

1. User visits `/auth`
2. Clicks "Sign Up"
3. Enters email, password, company details
4. Company status = "pending"
5. Super admin reviews in Admin Panel
6. Admin approves company
7. User can now login and access platform

### Creating Additional Admins

**Via Admin Panel:**
```
Admin Panel → User Management → Edit User → Assign Role: Admin
```

**Via SQL:**
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'newadmin@example.com';
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Failed to fetch" Error

**Cause**: CORS or incorrect API URL

**Solution:**
```bash
# Check environment variables
cat .env.local | grep VITE_SUPABASE_URL

# Verify Supabase project is accessible
curl https://your-project.supabase.co
```

#### 2. Cannot Login as Admin

**Solution:**
```sql
-- Verify user exists
SELECT * FROM auth.users WHERE email = 'abel.birara@gmail.com';

-- Verify role assigned
SELECT * FROM user_roles WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'abel.birara@gmail.com'
);

-- If missing, run seed script again
\i scripts/seed-admin.sql
```

#### 3. Database Connection Failed

**Solution:**
```bash
# Test PostgreSQL connection
psql -U socialhub_user -d socialhub -h localhost

# Check PostgreSQL is running
sudo systemctl status postgresql

# Check firewall
sudo ufw status
```

#### 4. OAuth Callback Fails

**Causes:**
- Incorrect redirect URI
- OAuth app not approved
- Missing credentials

**Solution:**
1. Verify redirect URI matches exactly in platform developer console
2. Check OAuth credentials in Admin Panel → Platform OAuth Apps
3. Ensure platform app is in production mode (not development)
4. Check edge function logs: `supabase functions logs oauth-callback`

#### 5. 502 Bad Gateway (Nginx)

**Solution:**
```bash
# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /var/www/socialhub/dist/

# Check Nginx configuration
sudo nginx -t

# Rebuild frontend if needed
npm run build
```

---

## 📊 Monitoring & Maintenance

### Database Health

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '5 seconds';
```

### Application Logs

**Lovable Cloud:**
- Access logs via Lovable Dashboard
- Monitor edge function logs

**VPS:**
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Backup Strategy

**Lovable Cloud:**
- Automatic daily backups included
- Point-in-time recovery available

**VPS:**
```bash
# Create backup script
cat > /usr/local/bin/backup-socialhub.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/var/backups/socialhub
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U socialhub_user socialhub | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-socialhub.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-socialhub.sh") | crontab -
```

---

## 🔄 Updating the Application

### Lovable Cloud

Updates are automatic via Lovable platform.

### VPS Self-Hosted

```bash
# 1. Backup first!
/usr/local/bin/backup-socialhub.sh

# 2. Pull latest changes
cd /var/www/socialhub
git pull origin main

# 3. Update dependencies
npm install

# 4. Run new migrations (if any)
psql -U socialhub_user -d socialhub -f supabase/migrations/new_migration.sql

# 5. Rebuild frontend
npm run build

# 6. Restart services
sudo systemctl restart nginx

# 7. Deploy updated edge functions
supabase functions deploy
```

---

## 📞 Support & Resources

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Getting Help
- Check logs first
- Review error messages carefully
- Test in development environment
- Search existing issues

### Platform Differences

| Feature | Lovable Cloud | VPS Self-Hosted |
|---------|--------------|-----------------|
| Setup Time | 5 minutes | 1-2 hours |
| Maintenance | Automatic | Manual |
| Cost | Subscription | Infrastructure only |
| Control | Limited | Full |
| Scalability | Automatic | Manual |
| Backups | Automatic | Manual setup |
| SSL | Included | Manual (Let's Encrypt) |
| Updates | Automatic | Manual |

---

## ✅ Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Change default admin password
- [ ] Configure OAuth apps for social platforms
- [ ] Test user signup flow
- [ ] Test company approval process
- [ ] Verify email notifications work
- [ ] Check all pages load correctly

### Week 1
- [ ] Setup monitoring alerts
- [ ] Configure backup strategy
- [ ] Test all integrations
- [ ] Review security settings
- [ ] Document custom configurations
- [ ] Train team members

### Ongoing
- [ ] Monitor error logs weekly
- [ ] Review user feedback
- [ ] Check database performance
- [ ] Update OAuth tokens as needed
- [ ] Review and approve new users
- [ ] Backup database regularly (VPS)

---

## 🎯 OAuth Centralized Management Guide

### How It Works

1. **Super Admin Setup** (One Time)
   - Create developer accounts on each social platform
   - Register OAuth app for each platform
   - Enter credentials in Platform OAuth Apps

2. **User Connection**
   - Users don't need developer accounts
   - Click "Connect" → Authorize super admin's app
   - Their personal access token is saved
   - They can publish to their own accounts

3. **Company Override** (Optional)
   - Companies can use their own OAuth apps
   - Toggle "Use Platform OAuth" off
   - Enter their own credentials

### Platform-Specific Setup

#### Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create new app → Type: Business
3. Add Facebook Login product
4. Get App ID and App Secret
5. Add redirect URI: `https://yourdomain.com/auth/callback/facebook`

#### Twitter/X
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create new app
3. Get API Key and API Secret
4. Enable OAuth 2.0
5. Add callback URL: `https://yourdomain.com/auth/callback/twitter`

#### LinkedIn
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create new app
3. Get Client ID and Client Secret
4. Add redirect URL: `https://yourdomain.com/auth/callback/linkedin`

---

## 📝 License & Credits

Built with React, TypeScript, Tailwind CSS, and Supabase.

---

**Need Help?** Review the troubleshooting section or check application logs.
