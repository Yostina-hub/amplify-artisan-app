# Self-Hosted Setup Guide

## Initial Admin Account Setup

For self-hosted deployments, follow these steps to create the initial admin account:

### Option 1: Sign Up Through the Application (Recommended)

1. Navigate to your deployed application URL
2. Go to the `/auth` page
3. Click on "Sign Up" tab
4. Register with:
   - **Email**: abel.birara@gmail.com
   - **Password**: Abel@2025 (or your preferred password)
   - **Full Name**: Your name

5. The system will automatically assign admin role to this email address

**Important**: Make sure email confirmation is disabled in your Supabase Auth settings for initial setup.

### Option 2: Create Admin User via SQL (If signup is not working)

If you cannot sign up through the application, run this SQL script directly in your Supabase SQL editor:

```sql
-- First, ensure auth.users entry exists
-- You'll need to hash the password first using Supabase's auth.crypt function
-- This is a manual process and requires direct database access

-- After user is created in auth.users, the handle_new_user() trigger will automatically:
-- 1. Create a profile entry
-- 2. Assign admin role (for abel.birara@gmail.com)

-- If the trigger didn't fire, you can manually assign admin role:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'abel.birara@gmail.com'
ON CONFLICT DO NOTHING;
```

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
