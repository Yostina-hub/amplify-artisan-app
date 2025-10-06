# VPS Deployment Guide

## Prerequisites

1. **VPS Server** with Node.js 18+ installed
2. **Domain name** pointed to your VPS
3. **Supabase Account** (create at https://supabase.com)

## Step 1: Create Your Supabase Project

1. Go to https://supabase.com and create a new project
2. Wait for the database to initialize (2-3 minutes)
3. Note down these credentials from Settings → API:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key
   - Service Role Key (keep secret!)

## Step 2: Configure Environment Variables

On your VPS, create a `.env` file in the project root:

```bash
# Replace with YOUR Supabase credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
VITE_SUPABASE_PROJECT_ID=your-project-ref

# For migrations (optional, if running locally)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

**CRITICAL**: Do NOT use the Lovable Cloud credentials (`kdqibmhpebndlmzjhuvf`) in production!

## Step 3: Run Database Migrations

You have two options:

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the entire content of `database-migration.sql`
3. Paste and execute it
4. Apply any migrations from `supabase/migrations/` folder (in order by date)

### Option B: Via Command Line

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Step 4: Configure Supabase Auth

In your Supabase Dashboard → Authentication → URL Configuration:

1. **Site URL**: `https://yourdomain.com`
2. **Redirect URLs**: Add these:
   - `https://yourdomain.com/**`
   - `https://yourdomain.com/auth/callback`

In Authentication → Email Auth:
1. **Enable Email provider**
2. **Disable "Confirm email"** (for easier testing, re-enable in production)

## Step 5: Configure CORS

In Supabase Dashboard → Settings → API → CORS:

Add your domain:
```
https://yourdomain.com
```

## Step 6: Build and Deploy Frontend

On your VPS:

```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# The build output will be in ./dist folder
```

## Step 7: Configure Web Server (Nginx Example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/your/project/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Then:
```bash
sudo systemctl restart nginx
```

## Step 8: Create Admin User

1. Go to `https://yourdomain.com/auth`
2. Sign up with email: `abel.birara@gmail.com` (or change this in the database function)
3. Password: Your secure password
4. The system will automatically assign admin role to this email

### Verify Admin User

Run this in Supabase SQL Editor:

```sql
-- Check if admin user exists
SELECT 
  u.email,
  p.full_name,
  ur.role
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'abel.birara@gmail.com';
```

## Common Issues & Solutions

### "Failed to fetch" Error

**Cause**: Frontend can't reach Supabase backend

**Solutions**:
1. Verify `.env` has correct Supabase URL and key
2. Rebuild frontend after changing `.env`: `npm run build`
3. Check Supabase CORS settings include your domain
4. Verify Site URL in Supabase Auth settings

### Cannot Login After Signup

**Cause**: Email confirmation required

**Solution**: 
```sql
-- Disable email confirmation in Supabase SQL Editor
UPDATE auth.config
SET value = 'false'
WHERE parameter = 'enable_signup';

-- Or manually confirm user
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'your-email@example.com';
```

### Database Connection Errors

**Cause**: Migrations not applied

**Solution**: Run all migrations via Supabase Dashboard SQL Editor

### 502 Bad Gateway

**Cause**: Nginx misconfiguration or build folder wrong

**Solution**:
1. Verify `root` path in nginx config points to `/dist` folder
2. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`

## Security Checklist for Production

- [ ] Use strong, unique passwords
- [ ] Enable email confirmation
- [ ] Configure SSL/HTTPS (use Let's Encrypt)
- [ ] Set up firewall (UFW/iptables)
- [ ] Enable Supabase RLS policies (already configured)
- [ ] Regularly backup your database
- [ ] Keep dependencies updated
- [ ] Monitor logs for suspicious activity
- [ ] Use environment-specific secrets (don't commit `.env`)

## Updating Your Deployment

```bash
# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild
npm run build

# Restart nginx
sudo systemctl restart nginx
```

## Support

If issues persist:
1. Check browser console (F12) for errors
2. Check Supabase logs in Dashboard → Logs
3. Check nginx error logs
4. Verify all environment variables are set correctly
