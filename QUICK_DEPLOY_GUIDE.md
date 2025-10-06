# Quick Deployment Reference

## 🔐 Super Admin Credentials (Both Modes)

```
Email: abel.birara@gmail.com
Password: Admin@2025
```

**⚠️ CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

---

## 🌐 Lovable Cloud (Current Setup)

**Status**: ✅ Active and configured

**Access**: Already deployed at your Lovable domain

**Super Admin**:
- Already configured automatically
- No manual setup needed
- Just login with credentials above

**User Flow**:
1. **Admin** (abel.birara@gmail.com): Sign up once → Automatic admin role → Login immediately
2. **Other users**: Sign up → Pending approval → Admin approves → Assign role → Access granted

---

## 💻 VPS Self-Hosted Deployment

### Prerequisites
- Ubuntu/Debian VPS
- PostgreSQL 14+
- Node.js 18+
- Nginx/Apache
- Domain with DNS configured

### Quick Deploy (3 Steps)

```bash
# 1. Clone and setup
git clone https://github.com/your-repo/socialhub.git
cd socialhub
cp .env.local.example .env.local

# 2. Configure database
# Edit .env.local with your DATABASE_URL
nano .env.local

# 3. Deploy (auto-seeds admin!)
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**That's it!** Admin user is automatically created.

### What `deploy.sh` Does Automatically:
1. ✅ Backs up database
2. ✅ Runs migrations
3. ✅ **Seeds super admin** (abel.birara@gmail.com / Admin@2025)
4. ✅ Installs dependencies
5. ✅ Builds frontend
6. ✅ Restarts web server

### First Login (VPS)
1. Go to: `https://yourdomain.com/auth`
2. Click "Sign In"
3. Use credentials above
4. **Change password immediately!**

---

## 📊 Comparison

| Feature | Lovable Cloud | VPS Self-Hosted |
|---------|--------------|-----------------|
| **Setup Time** | 0 minutes | ~30 minutes |
| **Admin Setup** | Automatic | Automatic (via deploy.sh) |
| **Database** | Managed Supabase | Your PostgreSQL |
| **Scaling** | Automatic | Manual |
| **Cost** | Usage-based | Fixed VPS |
| **Control** | Limited | Full |
| **Backups** | Automatic | Manual (via cron) |
| **SSL** | Automatic | Manual (Let's Encrypt) |

---

## 🔄 User Management (Both Modes)

### Super Admin (Auto-Created)
- ✅ Email: abel.birara@gmail.com
- ✅ Logs in immediately
- ✅ Full system access
- ✅ Can approve users
- ✅ Can assign roles

### Regular Users
1. User signs up → Account created (no role)
2. Redirected to `/pending-approval`
3. Admin receives notification
4. Admin approves in User Management
5. Admin assigns role (admin/agent/user)
6. User can access system

### Creating Additional Admins

**Via UI (Recommended)**:
1. Login as super admin
2. User Management → Select user
3. Assign "Admin" role

**Via SQL (Emergency)**:
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'newadmin@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## 🚨 Troubleshooting

### "Failed to fetch" (VPS)
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Verify environment
cat .env.local | grep DATABASE_URL

# Check if admin exists
psql $DATABASE_URL -c "SELECT email FROM auth.users WHERE email='abel.birara@gmail.com';"
```

### Can't Login (VPS)
```bash
# Re-seed admin user
psql $DATABASE_URL < scripts/seed-admin.sql

# Verify admin role
psql $DATABASE_URL -c "
SELECT u.email, ur.role 
FROM auth.users u 
JOIN user_roles ur ON ur.user_id = u.id 
WHERE u.email = 'abel.birara@gmail.com';
"
```

### Can't Login (Lovable Cloud)
1. Sign up with abel.birara@gmail.com
2. System auto-assigns admin role
3. No approval needed

---

## 📚 Full Documentation

- **Lovable Cloud**: Built-in, see Lovable docs
- **VPS Complete Guide**: See `DEPLOYMENT_SETUP.md`
- **Self-Host Setup**: See `SELF_HOST_SETUP.md`
- **VPS Only**: See `VPS_DEPLOYMENT_GUIDE.md`

---

## 🔒 Security Checklist

### Immediate (Both Modes)
- [ ] Change default admin password
- [ ] Review user roles
- [ ] Test login/logout flow

### Lovable Cloud
- [ ] Review RLS policies in backend
- [ ] Check auth settings
- [ ] Monitor usage logs

### VPS Self-Hosted
- [ ] Enable SSL (Let's Encrypt)
- [ ] Configure firewall (UFW)
- [ ] Set up automated backups
- [ ] Enable fail2ban
- [ ] Harden PostgreSQL
- [ ] Review nginx security headers

---

**Need Help?**
1. Check relevant documentation above
2. Review console/logs
3. Test database connectivity
4. Verify environment variables
