# Complete Self-Hosted Supabase Deployment Guide

## 📋 Overview

This guide covers deploying the SocialHub CRM platform on your own self-hosted Supabase instance with complete database schema and all edge functions.

---

## 🎯 Prerequisites

### System Requirements
- **OS**: Ubuntu 22.04 LTS or Debian 11+
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 50GB minimum
- **CPU**: 2 cores minimum

### Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
  docker.io \
  docker-compose \
  git \
  nginx \
  certbot \
  python3-certbot-nginx \
  postgresql-client \
  nodejs \
  npm

# Install Deno (for edge functions)
curl -fsSL https://deno.land/install.sh | sh
```

---

## 🚀 Step 1: Deploy Self-Hosted Supabase

### Clone Supabase
```bash
cd /opt
sudo git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
```

### Configure Environment
```bash
# Copy example env
sudo cp .env.example .env

# Generate secrets
sudo nano .env
```

**Key Variables to Configure:**
```env
# Database
POSTGRES_PASSWORD=your_super_secure_password_here
POSTGRES_DB=postgres

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here

# Anon/Service Role Keys (generate with Supabase CLI or online tool)
ANON_KEY=your_anon_key_here
SERVICE_ROLE_KEY=your_service_role_key_here

# API URLs
API_EXTERNAL_URL=https://api.yourdomain.com
SUPABASE_PUBLIC_URL=https://yourdomain.com

# Studio credentials
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your_admin_password_here

# Email (Optional - for auth)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_ADMIN_EMAIL=admin@yourdomain.com
```

### Start Supabase
```bash
sudo docker-compose up -d
```

### Verify Installation
```bash
# Check services
sudo docker-compose ps

# Access Studio at http://your-server-ip:3000
```

---

## 📊 Step 2: Database Setup

### Connect to Database
```bash
# Get PostgreSQL container ID
sudo docker ps | grep postgres

# Connect to database
sudo docker exec -it <container_id> psql -U postgres
```

### Run Complete Migration
```bash
# Download migration file
wget https://your-repo/scripts/complete_migration_self_hosted.sql

# Execute migration
sudo docker exec -i <postgres_container_id> psql -U postgres < complete_migration_self_hosted.sql
```

Or via psql:
```sql
\i /path/to/complete_migration_self_hosted.sql
```

### Create Super Admin

**Option 1: Run the seed script (Recommended)**
```bash
# Execute the seed script that creates admin user
sudo docker exec -i <postgres_container_id> psql -U postgres < scripts/seed-admin.sql
```

**Option 2: Manual SQL (if seed script fails)**
```sql
-- IMPORTANT: Enable the pgcrypto extension first
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert super admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'abel.birara@gmail.com',
  crypt('Admin@2025', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Super Admin"}'::jsonb,
  now(),
  now(),
  '',
  'authenticated',
  'authenticated'
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Create profile
INSERT INTO public.profiles (id, full_name, email)
SELECT id, 'Super Admin', email
FROM auth.users
WHERE email = 'abel.birara@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Assign admin role (no company_id for super admin)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'abel.birara@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify admin user was created
SELECT 
  u.email,
  u.email_confirmed_at,
  p.full_name,
  ur.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'abel.birara@gmail.com';
```

**Option 3: Use Supabase Studio (Easiest)**
1. Access Studio at `http://your-server-ip:3000` or `https://studio.yourdomain.com`
2. Navigate to Authentication → Users
3. Click "Add User"
4. Email: `abel.birara@gmail.com`
5. Password: `Admin@2025`
6. Enable "Auto Confirm User"
7. After creating, go to SQL Editor and run:
```sql
-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'abel.birara@gmail.com'
ON CONFLICT DO NOTHING;
```

---

## ⚡ Step 3: Deploy Edge Functions

### Install Supabase CLI
```bash
# Install globally
npm install -g supabase

# Verify installation
supabase --version
```

### Login to Self-Hosted Instance
```bash
supabase login

# Link to your project
supabase link --project-ref <your_project_id>
```

### Deploy All Edge Functions

Create this deployment script `deploy-functions.sh`:
```bash
#!/bin/bash

FUNCTIONS=(
  "ai-crm-assistant"
  "ai-lead-scoring"
  "ai-sales-forecast"
  "analyze-sentiment"
  "analyze-social-insights"
  "analyze-subscription"
  "analyze-user-engagement"
  "approve-post"
  "calculate-reach-score"
  "create-user"
  "delete-user"
  "execute-automation"
  "fetch-social-messages"
  "generate-insights"
  "generate-recommendations"
  "generate-social-content"
  "live-chat-ai-responder"
  "live-chat-init"
  "live-chat-send"
  "moderate-content"
  "notify-post-status"
  "oauth-callback"
  "post-to-telegram"
  "post-to-tiktok"
  "process-payment"
  "process-voice-query"
  "publish-scheduled-posts"
  "publish-to-platform"
  "recommend-ads"
  "schedule-automation"
  "send-company-status-email"
  "send-marketing-email"
  "send-password-reset-email"
  "send-trial-welcome-email"
  "send-upgrade-confirmation"
  "send-user-welcome-email"
  "sync-social-metrics"
  "sync-telegram-metrics"
  "text-to-speech"
  "track-email-open"
  "transcribe-audio"
)

echo "🚀 Deploying edge functions..."

for func in "${FUNCTIONS[@]}"; do
  echo "📦 Deploying $func..."
  supabase functions deploy $func
  
  if [ $? -eq 0 ]; then
    echo "✅ $func deployed successfully"
  else
    echo "❌ Failed to deploy $func"
  fi
done

echo "✅ All functions deployed!"
```

Run deployment:
```bash
chmod +x deploy-functions.sh
./deploy-functions.sh
```

---

## 🔐 Step 4: Configure Secrets

### Required Secrets

Create `set-secrets.sh`:
```bash
#!/bin/bash

# AI & ML
supabase secrets set LOVABLE_API_KEY="your_lovable_api_key"
supabase secrets set OPENAI_API_KEY="your_openai_api_key"
supabase secrets set GOOGLE_GEMINI_API_KEY="your_gemini_api_key"

# TTS
supabase secrets set ELEVENLABS_API_KEY="your_elevenlabs_key"

# Database
supabase secrets set SUPABASE_URL="https://api.yourdomain.com"
supabase secrets set SUPABASE_ANON_KEY="your_anon_key"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
supabase secrets set SUPABASE_DB_URL="postgresql://postgres:password@db:5432/postgres"
supabase secrets set SUPABASE_PUBLISHABLE_KEY="your_anon_key"

echo "✅ All secrets configured!"
```

Run:
```bash
chmod +x set-secrets.sh
./set-secrets.sh
```

---

## 🌐 Step 5: Frontend Deployment

### Clone and Build
```bash
cd /var/www
git clone https://your-repo/socialhub-crm.git
cd socialhub-crm

# Install dependencies
npm install

# Create production env
cat > .env.production << EOF
VITE_SUPABASE_URL=https://api.yourdomain.com
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id
EOF

# Build
npm run build
```

### Configure Nginx

Create `/etc/nginx/sites-available/socialhub`:
```nginx
# API Server
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend App
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/socialhub-crm/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

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
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}

# Studio (Admin Panel)
server {
    listen 80;
    server_name studio.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/socialhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Setup SSL
```bash
# Get certificates for all domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d studio.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## 🔧 Step 6: Configure Supabase Auth

### Access Studio
Navigate to `https://studio.yourdomain.com`

Login with credentials from `.env`

### Configure Auth Settings

**Authentication → URL Configuration**
```
Site URL: https://yourdomain.com
Redirect URLs: https://yourdomain.com/auth/callback
```

**Authentication → Email**
- Enable Email provider
- Configure SMTP settings
- Disable "Confirm email" for development

**Authentication → Providers** (Optional)
- Configure Google OAuth
- Configure GitHub OAuth
- Configure other providers as needed

---

## 📡 Step 7: Setup Scheduled Tasks

### Create Cron Job for Post Publishing

```bash
crontab -e
```

Add:
```cron
# Publish scheduled posts every minute
* * * * * curl -X POST https://api.yourdomain.com/functions/v1/publish-scheduled-posts -H "Authorization: Bearer your_anon_key"

# Sync social metrics every hour
0 * * * * curl -X POST https://api.yourdomain.com/functions/v1/sync-social-metrics -H "Authorization: Bearer your_anon_key"

# Backup database daily at 2 AM
0 2 * * * /usr/local/bin/backup-database.sh
```

### Create Backup Script

`/usr/local/bin/backup-database.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/socialhub"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_ID=$(sudo docker ps -qf "name=supabase-db")

mkdir -p $BACKUP_DIR

# Backup database
sudo docker exec $CONTAINER_ID pg_dump -U postgres postgres | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-database.sh
```

---

## 🔍 Step 8: Monitoring & Logs

### View Edge Function Logs
```bash
# Follow logs for specific function
supabase functions logs publish-scheduled-posts --follow

# View all function logs
sudo docker logs -f <edge-runtime-container-id>
```

### View Database Logs
```bash
sudo docker logs -f <postgres-container-id>
```

### Monitor System Resources
```bash
# Install monitoring tools
sudo apt install htop iotop

# View real-time stats
htop
```

### Setup Log Rotation

Create `/etc/logrotate.d/supabase`:
```
/var/log/supabase/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
}
```

---

## 🐛 Troubleshooting

### Issue: Edge Functions Not Deploying

**Solution:**
```bash
# Check Deno installation
deno --version

# Reinstall Supabase CLI
npm uninstall -g supabase
npm install -g supabase@latest

# Clear cache and retry
rm -rf ~/.supabase
supabase functions deploy <function-name>
```

### Issue: Database Connection Failed

**Solution:**
```bash
# Check PostgreSQL container status
sudo docker ps | grep postgres

# Restart database
sudo docker-compose restart db

# Check logs
sudo docker logs <postgres-container-id>
```

### Issue: Posts Not Publishing (Check Constraint Error)

**Solution:**
```sql
-- Fix status check constraint
ALTER TABLE social_media_posts DROP CONSTRAINT IF EXISTS social_media_posts_status_check;

ALTER TABLE social_media_posts ADD CONSTRAINT social_media_posts_status_check 
CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'pending_approval', 'approved', 'rejected'));
```

### Issue: CORS Errors

**Solution:**
```bash
# Update Supabase configuration
cd /opt/supabase/docker
sudo nano .env
```

Add:
```env
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Restart:
```bash
sudo docker-compose restart kong
```

### Issue: Cannot Login with Default Credentials

**Solutions to try in order:**

1. **Check if user exists:**
```sql
SELECT id, email, email_confirmed_at, encrypted_password IS NOT NULL as has_password
FROM auth.users 
WHERE email = 'abel.birara@gmail.com';
```

2. **If user doesn't exist, create it using Option 3 (Studio) from setup section above**

3. **If user exists but login fails, reset password:**
```sql
-- Update password
UPDATE auth.users
SET 
  encrypted_password = crypt('Admin@2025', gen_salt('bf')),
  email_confirmed_at = now()
WHERE email = 'abel.birara@gmail.com';
```

4. **Verify admin role:**
```sql
-- Check roles
SELECT u.email, ur.role, ur.company_id
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'abel.birara@gmail.com';

-- Add admin role if missing
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'abel.birara@gmail.com'
ON CONFLICT DO NOTHING;
```

5. **Check Supabase Auth configuration:**
   - In Studio, go to Authentication → Settings
   - Ensure "Enable Email Signup" is ON
   - Disable "Confirm email" for easier testing
   - Set Site URL to your domain: `https://yourdomain.com`
   - Add Redirect URLs: `https://yourdomain.com/**`

### Issue: Email Not Sending

**Solution:**
```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Update SMTP settings in Supabase Studio
# Authentication → Settings → SMTP
```

### Issue: SSL Certificate Errors

**Solution:**
```bash
# Renew certificates
sudo certbot renew --force-renewal

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Security Checklist

### Firewall Configuration
```bash
# Install UFW
sudo apt install ufw

# Allow specific ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Deny all other incoming
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Enable firewall
sudo ufw enable
```

### Database Security
```bash
# Change PostgreSQL password
sudo docker exec -it <postgres_container> psql -U postgres
ALTER USER postgres WITH PASSWORD 'new_secure_password';
```

### Secure Secrets
```bash
# Never commit .env files
echo ".env*" >> .gitignore

# Use secrets management
supabase secrets list

# Rotate keys regularly
```

### Enable Audit Logging
```sql
-- Enable audit trail
INSERT INTO security_audit_log (user_id, action, details)
VALUES (auth.uid(), 'system_access', '{"ip": "0.0.0.0"}'::jsonb);
```

---

## 📈 Performance Optimization

### Database Indexing
```sql
-- Add indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_posts_company_status 
ON social_media_posts(company_id, status);

CREATE INDEX CONCURRENTLY idx_posts_scheduled 
ON social_media_posts(scheduled_for) 
WHERE status = 'scheduled';
```

### Connection Pooling
Update Supabase `.env`:
```env
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10
```

### CDN Setup (Optional)
```nginx
# Add CDN headers
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header CDN-Cache-Control "max-age=31536000";
}
```

---

## 🔄 Updating the Application

### Update Frontend
```bash
cd /var/www/socialhub-crm
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

### Update Edge Functions
```bash
./deploy-functions.sh
```

### Update Database Schema
```bash
# Create new migration
supabase migration new add_new_feature

# Edit migration file
nano supabase/migrations/<timestamp>_add_new_feature.sql

# Apply migration
sudo docker exec -i <postgres_container> psql -U postgres < supabase/migrations/<timestamp>_add_new_feature.sql
```

### Update Supabase
```bash
cd /opt/supabase/docker
sudo docker-compose pull
sudo docker-compose up -d
```

---

## 📞 Support & Resources

### Documentation
- [Supabase Self-Hosting](https://supabase.com/docs/guides/hosting/overview)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Useful Commands
```bash
# Check system resources
df -h
free -m
top

# View all Docker containers
sudo docker ps -a

# Restart all Supabase services
sudo docker-compose restart

# View edge function logs
supabase functions logs <function-name>

# Test database connection
psql postgresql://postgres:password@localhost:5432/postgres
```

---

## ✅ Post-Deployment Checklist

- [ ] Supabase services running
- [ ] Database migration completed
- [ ] Super admin created
- [ ] All 40+ edge functions deployed
- [ ] Secrets configured
- [ ] Frontend built and deployed
- [ ] Nginx configured with SSL
- [ ] Auth settings configured
- [ ] Scheduled tasks setup
- [ ] Backups configured
- [ ] Firewall enabled
- [ ] Monitoring in place
- [ ] Test user signup flow
- [ ] Test social media posting
- [ ] Test AI features
- [ ] Test live chat
- [ ] Verify email sending

---

## 🎉 Success!

Your self-hosted SocialHub CRM is now fully deployed!

**Access URLs:**
- Frontend: `https://yourdomain.com`
- API: `https://api.yourdomain.com`
- Studio: `https://studio.yourdomain.com`

**Default Admin:**
- Email: `abel.birara@gmail.com`
- Password: `Admin@2025`

**⚠️ Change the default password immediately!**

---

**Need help?** Check the troubleshooting section or review edge function logs for specific errors.
