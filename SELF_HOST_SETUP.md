# Self-Hosted Setup Guide

## 🚀 Automatic Admin Setup (NEW!)

For self-hosted deployments, the super admin user is **automatically created during deployment**.

### Automated Setup Process

When you run `./scripts/deploy.sh`, the system automatically:
1. ✅ Creates database schema
2. ✅ Seeds super admin user
3. ✅ Assigns admin role
4. ✅ Configures authentication

**Default Super Admin Credentials:**
- **Email**: abel.birara@gmail.com
- **Password**: Admin@2025
- **Role**: Admin (full system access)

### First Login

1. Navigate to your deployed application URL
2. Go to `/auth`
3. Click "Sign In"
4. Use the credentials above
5. **Change password immediately** after first login

### ⚠️ Security Warning

**CRITICAL**: The default password `Admin@2025` MUST be changed immediately after deployment!

1. Login with default credentials
2. Go to Settings → Account
3. Change password to a strong, unique password
4. Consider enabling 2FA if available

---

## Manual Admin Creation (Fallback Option)

If automatic seeding fails, you can create the admin user manually:

### Option 1: Re-run Seed Script

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to project directory
cd /var/www/socialhub

# Run seed script manually
psql $DATABASE_URL < scripts/seed-admin.sql
```

### Option 2: Manual SQL (Emergency Only)

If the seed script fails, run this in your PostgreSQL console:

```bash
psql $DATABASE_URL
```

```sql
-- Run the entire seed-admin.sql file content
-- See scripts/seed-admin.sql for the complete script
\i scripts/seed-admin.sql
```

### Option 3: Via Supabase Dashboard (If using Supabase)

1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `scripts/seed-admin.sql`
3. Execute the script
4. Verify admin user created

### Configure Supabase Auth for Self-Hosted Deployment

1. **Disable Email Confirmation** (for easier initial setup):
   ```sql
   -- Run this in Supabase SQL Editor
   UPDATE auth.config
   SET value = 'false'
   WHERE parameter = 'enable_signup';
   ```

   Or via Supabase Dashboard: Authentication → Settings → Email Auth → Disable "Confirm email"

2. **Set Site URL and Redirect URLs**:
   In your Supabase project settings:
   - Site URL: `https://your-domain.com` (or your deployment URL)
   - Redirect URLs: Add your deployment URL to allowed redirect URLs

3. **Update Environment Variables**:
   Make sure your `.env` file has correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

### Troubleshooting Login Issues

If you still cannot login after signup:

1. **Check Email Confirmation Settings**:
   - Email confirmation must be disabled for initial setup
   - Or check your email inbox for confirmation link

2. **Verify Auth Configuration**:
   - Check that Site URL matches your deployment URL
   - Verify redirect URLs include your deployment domain

3. **Check User Creation**:
   ```sql
   -- Verify user was created
   SELECT id, email, created_at, email_confirmed_at
   FROM auth.users
   WHERE email = 'abel.birara@gmail.com';

   -- Verify admin role was assigned
   SELECT ur.role, p.email, p.full_name
   FROM user_roles ur
   JOIN profiles p ON p.id = ur.user_id
   WHERE p.email = 'abel.birara@gmail.com';
   ```

4. **Check Console Logs**:
   - Open browser DevTools (F12)
   - Check Console tab for authentication errors
   - Check Network tab for failed API calls

### Security Recommendations for Production

After initial setup:

1. **Change Default Password**: Immediately change the admin password after first login
2. **Enable Email Confirmation**: Re-enable email confirmation for security
3. **Configure SMTP**: Set up proper email delivery for password resets
4. **Set Up SSL**: Ensure your domain has valid SSL certificate
5. **Review RLS Policies**: Verify Row Level Security policies are active
6. **Backup Database**: Set up regular database backups

### Default Admin Email

The system is pre-configured to automatically assign admin privileges to:
- **Email**: abel.birara@gmail.com

This is set in the `handle_new_user()` database function. To change this:

```sql
-- Update the handle_new_user function to use different admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Create profile for the user
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Change this email to your admin email
  IF NEW.email = 'your-admin@email.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$function$;
```

## Support

If you continue to experience issues:
1. Check the browser console for errors
2. Review Supabase logs for authentication errors
3. Verify all environment variables are correctly set
4. Ensure database migrations have run successfully
