# SocialHub CRM Platform

A comprehensive social media management and CRM platform built with React, TypeScript, and Lovable Cloud.

**Lovable Project URL**: https://lovable.dev/projects/3f0a824d-e9e3-4458-aa91-97073a4d1feb

---

## 🚀 Deployment Options

This project supports **two deployment modes**:

### 1. **Lovable Cloud** (Current & Recommended)
- ✅ **Status**: Active and configured
- ✅ **Super Admin**: Auto-configured
- ✅ **Zero setup**: Just click "Publish"
- ✅ **Backend**: Managed automatically
- ✅ **Scaling**: Automatic

**Quick Deploy**: Simply click "Publish" in [Lovable Project](https://lovable.dev/projects/3f0a824d-e9e3-4458-aa91-97073a4d1feb)

### 2. **VPS Self-Hosted**
- 🔧 **Full control**: Your own infrastructure
- 🔧 **Custom deployment**: Your VPS, your rules
- 🔧 **One-command deploy**: `./scripts/deploy.sh`
- 🔧 **Auto-seeded admin**: No manual user creation

**Quick Deploy**: See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md)

---

## 🔐 Super Admin Access (Both Modes)

**Default Credentials** (automatically configured):
```
Email: abel.birara@gmail.com
Password: Admin@2025
```

**⚠️ CRITICAL**: Change password immediately after first login!

### Login Steps:
1. Navigate to `/auth` page
2. Click "Sign In"  
3. Use credentials above
4. **Change password** in Settings → Account

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_DEPLOY_GUIDE.md](QUICK_DEPLOY_GUIDE.md) | Quick reference for both deployment modes |
| [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) | Complete dual deployment guide |
| [VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md) | VPS with Supabase setup |
| [SELF_HOST_SETUP.md](SELF_HOST_SETUP.md) | Self-hosted PostgreSQL configuration |

---

## 👥 User Management

### Super Admin (Auto-Created)
- ✅ Login immediately without approval
- ✅ Full system access
- ✅ Manage all users and settings

### Regular Users (Approval Required)
1. User signs up → Account created (no role assigned)
2. Redirected to "Pending Approval" page
3. Admin approves user in User Management panel
4. Admin assigns role (admin/agent/user)
5. User gains access to the system

---

## 🛠️ Tech Stack

This project is built with:

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn-ui components
- **Build Tool**: Vite
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL (managed by Lovable Cloud)
- **Auth**: Supabase Auth (managed by Lovable Cloud)
- **Storage**: Supabase Storage (managed by Lovable Cloud)

---

## 💻 Local Development

### Using Lovable (Recommended)

Simply visit the [Lovable Project](https://lovable.dev/projects/3f0a824d-e9e3-4458-aa91-97073a4d1feb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

### Using Your Preferred IDE

Requirements: Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Start development server
npm run dev
```

### Using GitHub Codespaces

1. Navigate to the main page of your repository
2. Click "Code" button (green button)
3. Select "Codespaces" tab
4. Click "New codespace"
5. Edit files directly and commit changes

### Direct GitHub Editing

1. Navigate to the desired file
2. Click "Edit" button (pencil icon)
3. Make your changes and commit

---

## 🌐 Deploying to Production

### Lovable Cloud (Recommended)

1. Open [Lovable Project](https://lovable.dev/projects/3f0a824d-e9e3-4458-aa91-97073a4d1feb)
2. Click **Share** → **Publish**
3. Your app is live with full backend!

### Custom Domain

To connect a custom domain:

1. Navigate to **Project** → **Settings** → **Domains**
2. Click **Connect Domain**
3. Follow the DNS configuration instructions

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

### VPS Self-Hosted

For complete control on your own VPS:

```bash
# One-command deployment
./scripts/deploy.sh
```

This automatically:
- Backs up database
- Runs migrations
- **Seeds super admin user**
- Builds frontend
- Restarts web server

See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) for full VPS setup guide.

---

## 🔍 Architecture Overview

### Lovable Cloud Mode (Current)
```
Frontend (React) → Lovable Cloud → Supabase Backend
                                  ├── PostgreSQL Database
                                  ├── Auth System
                                  ├── File Storage
                                  └── Edge Functions
```

### VPS Self-Hosted Mode
```
Frontend (React) → Your VPS → Your PostgreSQL
                            ├── Custom Auth Setup
                            └── Local File Storage
```

---

## 🚨 Troubleshooting

### Can't Login (Lovable Cloud)
1. Sign up with `abel.birara@gmail.com`
2. System auto-assigns admin role
3. No approval needed

### Can't Login (VPS)
```bash
# Re-seed admin user
psql $DATABASE_URL < scripts/seed-admin.sql

# Verify admin exists
psql $DATABASE_URL -c "SELECT u.email, ur.role FROM auth.users u JOIN user_roles ur ON ur.user_id = u.id WHERE u.email = 'abel.birara@gmail.com';"
```

### "Failed to fetch" Error (VPS)
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Verify environment variables
cat .env.local | grep DATABASE_URL
```

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🔒 Security

### Best Practices
- ✅ Change default admin password immediately
- ✅ Enable SSL/HTTPS for production
- ✅ Review RLS policies regularly
- ✅ Use strong passwords for all users
- ✅ Enable 2FA when available
- ✅ Regular security audits

### VPS Additional Security
- ✅ Configure firewall (UFW)
- ✅ Enable fail2ban
- ✅ Set up automated backups
- ✅ Keep system packages updated
- ✅ Harden PostgreSQL configuration

---

## 📊 Features

- 🎯 **CRM Management**: Contacts, Accounts, Leads, Opportunities
- 📱 **Social Media**: Multi-platform posting and monitoring
- 📊 **Analytics**: Comprehensive reporting and insights
- 🤖 **AI Integration**: Automated content generation and insights
- 📞 **Call Center**: Built-in softphone and call management
- 🔄 **Workflow Automation**: Custom workflows and triggers
- 📧 **Email Marketing**: Campaign management and tracking
- 💳 **Payment Processing**: Integrated payment gateway
- 👥 **User Management**: Role-based access control
- 🌐 **Multi-language**: Support for multiple languages

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is proprietary software. All rights reserved.

---

## 📞 Support

For issues, questions, or feature requests:

1. Check the [documentation](QUICK_DEPLOY_GUIDE.md)
2. Review [troubleshooting guide](#-troubleshooting)
3. Open an issue in the repository
4. Contact the development team

---

**Built with ❤️ using [Lovable](https://lovable.dev)**
