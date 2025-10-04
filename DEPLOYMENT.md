# Deployment Guide

This application supports **automatic environment detection** with two deployment modes:

## 🌟 Deployment Modes

### Mode 1: Lovable Cloud (Default - Recommended)
✅ **Automatically configured** - No setup needed
- Fully managed backend with Supabase
- Auto-scaling and high availability
- Zero infrastructure maintenance

### Mode 2: Self-Hosted VPS
🛠️ **Full control** - Deploy on your own server
- Complete data ownership
- Custom infrastructure
- Requires PostgreSQL + Supabase CLI setup

---

## 🚀 Automatic Environment Detection

The application **automatically detects** which mode to use based on environment variables in `.env.local`:

- **Lovable Cloud**: Uses `VITE_SUPABASE_URL` (already configured)
- **Self-Hosted**: Uses `DATABASE_URL` for local PostgreSQL

**No code changes needed** - just update `.env.local` and the app adapts automatically!

---

# 🏠 Self-Hosted Deployment (Mode 2)

## Prerequisites

- Linux VPS (Ubuntu 22.04 LTS recommended)
- Node.js 20+ installed
- Docker & Docker Compose (for Supabase)
- Git installed

## Quick Start (Automatic Setup with Supabase CLI)

### 1. Install Supabase CLI & Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
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

# Copy to nginx (if using)
sudo cp -r dist/* /var/www/html/
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

## Need Help?

- Check application logs: `journalctl -u nginx -f`
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
- Database connection issues: Verify DATABASE_URL in `.env.local`
