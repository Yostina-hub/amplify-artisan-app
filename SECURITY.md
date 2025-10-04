# Security Features Documentation

This document outlines all security features implemented in the database migration.

## 🔐 Row Level Security (RLS)

**ALL tables have RLS enabled** to protect data at the database level.

### What is RLS?
Row Level Security restricts which rows users can access based on policies. Even if application code has bugs, the database enforces access control.

## 🛡️ Security Features Included

### 1. Role-Based Access Control (RBAC)
Three user roles implemented:
- **Admin**: Full system access
- **Agent**: Company-level access
- **User**: Own data access only

### 2. Security Definer Functions
Functions that bypass RLS to prevent infinite recursion:
- `has_role()` - Check if user has specific role
- `get_user_roles()` - Get all roles for a user
- `get_user_company_id()` - Get user's company
- `has_active_trial()` - Check trial status
- `get_user_trial_info()` - Get trial details

### 3. Protected Views
Safe views without sensitive data:
- `social_media_accounts_safe` - No access tokens
- `profiles_safe` - No email addresses
- `email_configurations_safe` - No passwords
- `audit_log_view` - Enriched with user details

### 4. Audit Logging
All sensitive operations logged to `security_audit_log`:
- User actions tracked
- IP addresses recorded
- User agents captured
- Full change history

## 📋 RLS Policy Summary

### Public Access (No Auth Required)
- ✅ Company applications (insert only)
- ✅ Industries (view active only)
- ✅ Pricing plans (view active only)
- ✅ Landing page content (view active only)
- ✅ Subscription requests (insert only)

### User Access (Own Data Only)
- ✅ Profiles (view, update, delete own)
- ✅ User roles (view own)
- ✅ Social media accounts (CRUD own)
- ✅ Social media posts (CRUD own)
- ✅ Ad campaigns (CRUD own company)
- ✅ Influencers (CRUD own)
- ✅ User engagement (insert, view own)
- ✅ Ad impressions (insert, view own)

### Admin Access (Full System)
- ✅ All tables (full CRUD)
- ✅ User management
- ✅ Company approval
- ✅ Payment verification
- ✅ Content moderation
- ✅ System configuration

### Agent Access (Company-Level)
- ✅ View all company data
- ✅ Manage social accounts
- ✅ Manage campaigns
- ✅ View analytics

## 🔑 Authentication Requirements

### Critical: auth.uid() Function Required

All RLS policies depend on `auth.uid()` returning the current user's UUID.

**If using Supabase**: Works automatically ✅

**If self-hosting**: Must implement auth.uid() function (see DEPLOYMENT.md)

## 🚨 Security Best Practices

### 1. Never Disable RLS
```sql
-- ❌ NEVER DO THIS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ✅ Always keep RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### 2. Use Parameterized Queries
```javascript
// ❌ Vulnerable to SQL injection
client.query(`SELECT * FROM users WHERE email = '${userInput}'`);

// ✅ Safe parameterized query
client.query('SELECT * FROM users WHERE email = $1', [userInput]);
```

### 3. Validate Input
```javascript
// ✅ Always validate on both client and server
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
```

### 4. Use HTTPS Only
```nginx
# Force HTTPS redirect
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

### 5. Protect Sensitive Columns
```sql
-- ✅ Use views to hide sensitive data
CREATE VIEW profiles_safe AS
SELECT id, full_name, avatar_url  -- No email!
FROM profiles;
```

## 🔍 Testing RLS Policies

Test policies work correctly:

```sql
-- Test as specific user
SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "user-uuid-here"}';

-- Try to access data - should respect RLS
SELECT * FROM social_media_posts;

-- Reset
RESET role;
```

## 📊 Monitoring Security

### Check Audit Logs
```sql
-- Recent admin actions
SELECT * FROM audit_log_view 
WHERE action IN ('UPDATE', 'DELETE')
ORDER BY created_at DESC 
LIMIT 20;

-- Failed access attempts (from application logs)
SELECT * FROM security_audit_log
WHERE details->>'error' IS NOT NULL;
```

### Review RLS Policies
```sql
-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🆘 Security Incident Response

If you suspect a breach:

1. **Immediately**: Rotate all credentials
2. **Review**: Check audit_log_view for suspicious activity
3. **Update**: Change database passwords
4. **Verify**: Confirm RLS is enabled on all tables
5. **Monitor**: Watch logs for unusual patterns

## 📝 Regular Security Tasks

### Weekly
- [ ] Review audit logs for anomalies
- [ ] Check failed login attempts
- [ ] Verify backup integrity

### Monthly
- [ ] Update dependencies
- [ ] Review and update RLS policies
- [ ] Test disaster recovery
- [ ] Rotate API keys

### Quarterly
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review user permissions
- [ ] Update documentation

## 🔗 Additional Resources

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

## 🐛 Common Security Issues

### Issue: "Permission Denied" Errors
**Cause**: User doesn't have required role or RLS policy blocks access

**Solution**: 
```sql
-- Check user's roles
SELECT * FROM user_roles WHERE user_id = 'user-uuid';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

### Issue: Data Visible to Wrong Users
**Cause**: Overly permissive RLS policy

**Solution**: Review and tighten policies:
```sql
-- ❌ Too permissive
CREATE POLICY "Users can view posts" ON posts
FOR SELECT USING (true);  -- Everyone can see everything!

-- ✅ Properly restricted
CREATE POLICY "Users can view posts" ON posts
FOR SELECT USING (auth.uid() = user_id);
```

### Issue: "Infinite Recursion in RLS"
**Cause**: Policy references same table it's applied to

**Solution**: Use SECURITY DEFINER function:
```sql
-- Create function that bypasses RLS
CREATE FUNCTION check_permission(user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
  -- Implementation
$$;

-- Use in policy
CREATE POLICY "name" ON table
FOR SELECT USING (check_permission(auth.uid()));
```

## ✅ Security Verification Checklist

Before going to production:

- [ ] All tables have RLS enabled
- [ ] Test each role's access (admin, agent, user)
- [ ] Verify sensitive data is not exposed
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules in place
- [ ] Database backups automated
- [ ] Audit logging enabled
- [ ] Password policies enforced
- [ ] API rate limiting configured
- [ ] Error messages don't leak info

---

**Remember**: Security is not a one-time setup, it's an ongoing process!
