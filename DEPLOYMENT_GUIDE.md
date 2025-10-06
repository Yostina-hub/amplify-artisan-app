# Self-Hosted CRM Deployment Guide

Complete guide for deploying your CRM platform locally and on VPS with self-hosted Supabase.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  NestJS Backend  │────▶│   PostgreSQL    │
│  (React/Vite)   │     │   (Port 5000)    │     │   (Port 5432)   │
│  Port 5173/3000 │     └──────────────────┘     └─────────────────┘
└─────────────────┘              │                        ▲
                                 │                        │
                          ┌──────▼──────┐         ┌──────┴──────┐
                          │   Redis     │         │  Supabase   │
                          │ Port 6379   │         │  Kong/Auth  │
                          └─────────────┘         │  Port 8000  │
                                                  └─────────────┘
```

## Prerequisites

### Required Software
- Docker & Docker Compose (v2.0+)
- Node.js 18+ and npm
- Git
- PostgreSQL client tools (for migrations)

### System Requirements
**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB disk space

**Recommended (Production):**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage

## Quick Start (Local Development)

### 1. Clone and Setup

```bash
# Clone your repository
git clone <your-repo-url>
cd crm-platform

# Copy environment files
cp .env.docker .env
```

### 2. Start Docker Services

```bash
# Start all services (Postgres, Redis, Supabase Auth/API)
docker-compose up -d

# Check services are running
docker-compose ps
```

Wait 30 seconds for all services to initialize.

### 3. Initialize Database

```bash
# Run all migrations
./scripts/init-db.sh
```

This will:
- Create all tables
- Set up RLS policies
- Create necessary indexes
- Initialize default data

### 4. Start Backend

```bash
cd backend
npm install
npm run start:dev
```

Backend will be available at: `http://localhost:5000`

### 5. Start Frontend

```bash
# In a new terminal
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 6. Create First User

**Option A: Using Supabase Auth UI**

1. Go to http://localhost:3000 (Supabase Studio)
2. Navigate to Authentication
3. Create a new user

**Option B: Via API**

```bash
curl -X POST http://localhost:8000/auth/v1/signup \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "data": {
      "full_name": "Admin User"
    }
  }'
```

**Option C: Direct Database Insert**

```bash
PGPASSWORD=your-super-secret-and-long-postgres-password psql -h localhost -U postgres -d postgres -c "
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  crypt('SecurePassword123!', gen_salt('bf')),
  now(),
  now(),
  now()
);
"
```

### 7. Grant Admin Access

```bash
# Get user ID
USER_ID=$(PGPASSWORD=your-super-secret-and-long-postgres-password psql -h localhost -U postgres -d postgres -tAc "SELECT id FROM auth.users WHERE email='admin@example.com'")

# Grant super admin role
PGPASSWORD=your-super-secret-and-long-postgres-password psql -h localhost -U postgres -d postgres -c "
INSERT INTO user_roles (user_id, role, company_id)
VALUES ('$USER_ID', 'admin', NULL);
"
```

### 8. Login

Go to http://localhost:5173 and login with your credentials!

## VPS Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL client
sudo apt install -y postgresql-client
```

### 2. Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd crm-platform

# Update environment for production
cp .env.docker .env
nano .env
```

Update these values in `.env`:

```bash
# Generate strong passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Update URLs to your domain
API_EXTERNAL_URL=https://api.yourdomain.com
SITE_URL=https://yourdomain.com
```

### 3. Generate JWT Keys

```bash
# Install JWT generator
npm install -g jwt-cli

# Generate ANON key
jwt sign '{"role":"anon","iss":"supabase","iat":1641769200,"exp":1799535600}' \
  --secret="$JWT_SECRET" --algorithm=HS256

# Generate SERVICE_ROLE key
jwt sign '{"role":"service_role","iss":"supabase","iat":1641769200,"exp":1799535600}' \
  --secret="$JWT_SECRET" --algorithm=HS256
```

Update `ANON_KEY` and `SERVICE_ROLE_KEY` in `.env` and `supabase/kong.yml`.

### 4. Configure Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/crm
```

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Supabase API
server {
    listen 80;
    server_name supabase.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com -d supabase.yourdomain.com
```

### 5. Start Services

```bash
# Start Docker services
docker-compose up -d

# Wait for services to be ready
sleep 30

# Initialize database
./scripts/init-db.sh

# Start backend with PM2
cd backend
npm install
npm install -g pm2
pm2 start npm --name "crm-backend" -- run start:prod
pm2 save
pm2 startup

# Build and serve frontend
cd ..
npm install
npm run build
pm2 serve dist 5173 --name "crm-frontend" --spa
pm2 save
```

### 6. Configure Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Environment Variables

### Frontend (.env)

```bash
VITE_SUPABASE_URL=http://localhost:8000              # Or https://supabase.yourdomain.com
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=http://localhost:5000/api               # Or https://api.yourdomain.com/api
```

### Backend (backend/.env)

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/postgres
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=https://yourdomain.com
```

### Docker (.env.docker)

```bash
POSTGRES_PASSWORD=<strong-password>
JWT_SECRET=<jwt-secret-matching-backend>
API_EXTERNAL_URL=https://supabase.yourdomain.com
SITE_URL=https://yourdomain.com
ANON_KEY=<generated-anon-key>
SERVICE_ROLE_KEY=<generated-service-role-key>
```

## Maintenance

### Viewing Logs

```bash
# Docker services
docker-compose logs -f

# Backend
pm2 logs crm-backend

# Frontend
pm2 logs crm-frontend

# Specific service
docker-compose logs -f postgres
docker-compose logs -f auth
```

### Backup Database

```bash
# Create backup
docker exec crm_postgres pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20241006.sql | docker exec -i crm_postgres psql -U postgres postgres
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild
docker-compose down
docker-compose up -d --build

# Restart services
cd backend && pm2 restart crm-backend
cd .. && npm run build && pm2 restart crm-frontend
```

### Running Migrations

```bash
# Add new migration to supabase/migrations/
# Then run:
PGPASSWORD=your-password psql -h localhost -U postgres -d postgres -f supabase/migrations/new_migration.sql
```

## Troubleshooting

### Can't Connect to Database

```bash
# Check if Postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Authentication Not Working

```bash
# Check auth service
docker-compose logs auth

# Verify JWT keys match
cat .env | grep ANON_KEY
cat supabase/kong.yml | grep key
```

### Backend Won't Start

```bash
# Check environment variables
cd backend && cat .env

# Check if Redis is running
docker-compose ps redis

# Test database connection
PGPASSWORD=your-password psql -h localhost -U postgres -d postgres -c "SELECT 1"
```

### Frontend Can't Reach Backend

```bash
# Check CORS settings in backend
# Verify API_URL in frontend .env
cat .env | grep VITE_API_URL

# Test backend directly
curl http://localhost:5000/api/health
```

## Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Generate unique JWT secrets
- [ ] Enable firewall (ufw)
- [ ] Set up SSL certificates
- [ ] Configure Nginx security headers
- [ ] Limit database access
- [ ] Regular backups enabled
- [ ] Update Docker images regularly
- [ ] Monitor logs for suspicious activity
- [ ] Use strong admin passwords
- [ ] Enable 2FA for admin accounts (future feature)

## Performance Tuning

### PostgreSQL

```bash
# Edit postgresql.conf in Docker volume
docker exec -it crm_postgres bash
vi /var/lib/postgresql/data/postgresql.conf

# Recommended settings:
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
```

### Redis

```bash
# Increase memory limit
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Node.js Backend

```bash
# Increase memory for Node.js
pm2 delete crm-backend
pm2 start npm --name "crm-backend" --node-args="--max-old-space-size=2048" -- run start:prod
```

## Monitoring

### Set up Monitoring (Optional)

```bash
# Install monitoring tools
npm install -g pm2
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monitor with pm2
pm2 monit
```

## Support

### Useful Commands

```bash
# Check all services
docker-compose ps
pm2 status

# Restart everything
docker-compose restart
pm2 restart all

# View resource usage
docker stats
pm2 monit

# Database shell
PGPASSWORD=your-password psql -h localhost -U postgres -d postgres

# Redis shell
docker-compose exec redis redis-cli
```

### Common Issues

1. **Port already in use**: Change ports in docker-compose.yml
2. **Out of memory**: Increase Docker memory allocation
3. **Slow queries**: Add database indexes
4. **Auth failures**: Verify JWT keys match across all configs

## Next Steps

1. Set up automated backups
2. Configure monitoring and alerts
3. Set up CI/CD pipeline
4. Configure CDN for static assets
5. Implement rate limiting
6. Add application monitoring (Sentry, etc.)
7. Set up log aggregation

## Resources

- Supabase Docs: https://supabase.com/docs
- NestJS Docs: https://docs.nestjs.com
- Docker Docs: https://docs.docker.com
- Nginx Docs: https://nginx.org/en/docs/

---

Your CRM platform is now ready for self-hosted deployment!
