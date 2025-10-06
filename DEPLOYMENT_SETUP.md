# Dual Deployment Setup - Lovable Cloud & VPS Self-Hosted

This project supports two deployment modes:
1. **Lovable Cloud** (Managed Supabase) - Default, zero configuration
2. **VPS Self-Hosted** (Custom PostgreSQL) - Full control

## 🚀 Quick Start

### Option 1: Lovable Cloud (Recommended)

**Already configured!** No setup needed.

1. Click **Publish** in Lovable interface
2. Your app deploys automatically with backend
3. Super admin is auto-configured

**Default Admin Login:**
- Email: `abel.birara@gmail.com`
- Sign up once, automatically becomes admin
- No approval needed

### Option 2: VPS Self-Hosted

For full control on your own infrastructure.

## 📋 VPS Prerequisites

1. **Ubuntu/Debian VPS** with:
   - 2GB+ RAM
   - Node.js 18+
   - PostgreSQL 14+
   - Nginx or Apache

2. **Domain name** pointed to VPS

3. **SSL Certificate** (Let's Encrypt recommended)

## 🔧 VPS Installation

### Step 1: Clone Repository

```bash
cd /var/www
git clone https://github.com/your-repo/socialhub.git
cd socialhub
```

### Step 2: Configure Database

```bash
# Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE socialhub;
CREATE USER socialhub_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE socialhub TO socialhub_user;
\q
```

### Step 3: Configure Environment

```bash
# Create .env.local file
cp .env.local.example .env.local
nano .env.local
```

Edit `.env.local`:

```bash
# Comment out Lovable Cloud config
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...

# Add your PostgreSQL connection
DATABASE_URL=postgresql://socialhub_user:your_secure_password@localhost:5432/socialhub
```

### Step 4: Run Automated Deployment

```bash
# Make scripts executable
chmod +x scripts/deploy.sh

# Run deployment (automatically seeds admin user)
./scripts/deploy.sh
```

The script will:
- ✅ Backup database
- ✅ Run migrations
- ✅ **Automatically create super admin user**
- ✅ Install dependencies
- ✅ Build frontend
- ✅ Restart web server

### Step 5: Configure Web Server

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    root /var/www/socialhub/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

```bash
# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔐 Default Super Admin Credentials

**IMPORTANT:** These are automatically seeded during deployment:

```
Email: abel.birara@gmail.com
Password: Admin@2025
```

### First Login Steps:

1. Go to: `https://yourdomain.com/auth`
2. Login with credentials above
3. **Immediately change password** in Settings
4. Update email if needed

### Security Checklist:

- [ ] Change default admin password
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall (UFW)
- [ ] Set up automatic backups
- [ ] Review user permissions
- [ ] Enable fail2ban

## 🔄 Updating Deployment

```bash
cd /var/www/socialhub

# Pull latest changes
git pull origin main

# Run deployment script (safe, includes backup)
./scripts/deploy.sh
```

## 👥 User Management

### Admin User (Auto-Created)
- ✅ Automatically seeded during deployment
- ✅ Login immediately without approval
- ✅ Full system access

### Regular Users (Signup Flow)
1. User signs up at `/auth`
2. Account created but **no role assigned**
3. User redirected to `/pending-approval`
4. Admin approves user in admin panel
5. Admin assigns role (admin/agent/user)
6. User can now access system

### Creating Additional Admins

**Via Admin Panel:**
1. Login as super admin
2. Go to User Management
3. Select user
4. Assign "Admin" role

**Via SQL (Emergency):**
```sql
-- Assign admin role to user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'newadmin@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

## 🏗️ Architecture Comparison

| Feature | Lovable Cloud | VPS Self-Hosted |
|---------|--------------|-----------------|
| Database | Managed Supabase | Your PostgreSQL |
| Auth | Supabase Auth | Your PostgreSQL |
| Storage | Supabase Storage | Your File System |
| Edge Functions | Supabase Functions | Your API Server |
| Scaling | Automatic | Manual |
| Backups | Automatic | Manual |
| SSL | Automatic | Manual Setup |
| Cost | Usage-based | Fixed VPS cost |
| Control | Limited | Full control |

## 🔍 Troubleshooting

### "Failed to fetch" error

**Cause:** Frontend can't reach backend

**Solutions:**
```bash
# 1. Check database connection
psql $DATABASE_URL -c "SELECT 1"

# 2. Verify environment variables
cat .env.local

# 3. Check logs
tail -f /var/log/nginx/error.log
```

### Admin can't login

**Cause:** User not seeded or wrong credentials

**Solutions:**
```bash
# Re-run seeding script
psql $DATABASE_URL < scripts/seed-admin.sql

# Or manually verify
psql $DATABASE_URL -c "
SELECT u.email, ur.role 
FROM auth.users u 
JOIN user_roles ur ON ur.user_id = u.id 
WHERE u.email = 'abel.birara@gmail.com';
"
```

### Database migration fails

**Cause:** Tables already exist or connection error

**Solutions:**
```bash
# Check if database is accessible
psql $DATABASE_URL -c "\dt"

# If tables exist, migrations were already run
# Skip migration and just seed admin:
psql $DATABASE_URL < scripts/seed-admin.sql
```

## 📊 Monitoring

### Database Health
```bash
# Check connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check table sizes
psql $DATABASE_URL -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Application Logs
```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

## 🔒 Security Best Practices

### VPS Hardening
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Database Security
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf

# Set secure password encryption
password_encryption = scram-sha-256

# Restrict connections
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Only allow local connections
local   all   all   scram-sha-256
host    all   all   127.0.0.1/32   scram-sha-256
```

### Backup Strategy
```bash
# Create daily backup script
sudo nano /usr/local/bin/backup-socialhub.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/socialhub"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
pg_dump $DATABASE_URL > $BACKUP_DIR/db_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-socialhub.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-socialhub.sh") | crontab -
```

## 📞 Support

### Lovable Cloud Issues
- Check Lovable Cloud dashboard logs
- Review RLS policies
- Check auth configuration

### VPS Self-Hosted Issues
1. Check logs (nginx, postgresql)
2. Verify environment variables
3. Test database connectivity
4. Review firewall rules

### Common Commands
```bash
# Check service status
sudo systemctl status nginx
sudo systemctl status postgresql

# Restart services
sudo systemctl restart nginx
sudo systemctl restart postgresql

# View recent logs
journalctl -u nginx -n 50
journalctl -u postgresql -n 50
```

## 🎯 Migration Between Modes

### From Lovable Cloud to VPS

**Not recommended** - You'll lose managed features and automatic scaling.

If needed:
1. Export data from Lovable Cloud (Supabase dashboard)
2. Follow VPS installation steps above
3. Import data into VPS database
4. Update DNS to point to VPS

### From VPS to Lovable Cloud

**Recommended** - Simpler management and automatic scaling.

Steps:
1. Export data from VPS database
2. Create new Lovable Cloud project
3. Run migrations in Lovable Cloud
4. Import data
5. Update DNS to Lovable deployment

---

**Need help?** Check the logs first, then consult the troubleshooting section above.
