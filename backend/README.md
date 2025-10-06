# CRM Platform - NestJS Backend

Complete NestJS backend for the CRM platform with full control over authentication, business logic, and integrations.

## Architecture

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT + Passport
- **Background Jobs**: Bull + Redis
- **API Documentation**: Swagger/OpenAPI
- **Deployment**: Docker

## Features

- Multi-tenant company management
- Branch-level permissions
- Role-based access control (RBAC)
- JWT authentication
- Social media management with scheduled posts
- Real-time analytics
- Background job processing
- Email campaigns
- Call center integration
- Activity tracking
- Comprehensive API documentation

## Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication (JWT, Guards, Strategies)
│   ├── users/             # User management
│   ├── companies/         # Company management
│   ├── branches/          # Branch management
│   ├── leads/             # Lead management
│   ├── contacts/          # Contact management
│   ├── social/            # Social media (with Bull queue)
│   ├── analytics/         # Analytics & reporting
│   ├── payments/          # Payment processing
│   ├── email/             # Email campaigns
│   ├── automation/        # Workflow automation
│   ├── call-center/       # Call center features
│   ├── activities/        # Activity tracking
│   ├── common/            # Shared utilities
│   └── main.ts            # Application bootstrap
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- Redis (for background jobs)
- PostgreSQL database (Supabase)

### Installation

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `JWT_SECRET` - A secure random string for JWT signing
   - `REDIS_HOST` and `REDIS_PORT` - Redis connection

3. **Start Redis** (if not using Docker):
   ```bash
   redis-server
   ```

4. **Run development server**:
   ```bash
   npm run start:dev
   ```

   Backend will run on: `http://localhost:5000`

5. **Access API documentation**:
   ```
   http://localhost:5000/api/docs
   ```

### Using Docker

1. **Build and run**:
   ```bash
   docker-compose up --build
   ```

2. **Stop services**:
   ```bash
   docker-compose down
   ```

## API Endpoints

All endpoints are prefixed with `/api`

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Companies
- `GET /api/companies` - List companies
- `GET /api/companies/:id` - Get company
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Branches
- `GET /api/branches` - List branches
- `GET /api/branches/:id` - Get branch
- `POST /api/branches` - Create branch
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Leads
- `GET /api/leads` - List leads
- `GET /api/leads/:id` - Get lead
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Contacts
- `GET /api/contacts` - List contacts
- `GET /api/contacts/:id` - Get contact
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Social Media
- `GET /api/social/posts` - List posts
- `POST /api/social/posts` - Create post
- `POST /api/social/posts/:id/publish` - Publish post
- `GET /api/social/metrics` - Get metrics
- `POST /api/social/metrics/sync` - Sync metrics

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/revenue` - Revenue analytics

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control

Roles:
- `super_admin` - Full system access
- `admin` - Company-level access
- `manager` - Branch-level access
- `user` - Limited access

Use the `@Roles()` decorator on controllers to restrict access.

## Background Jobs

The system uses Bull queues for:
- Scheduled social media posts
- Metric synchronization
- Email campaigns
- Data processing

Jobs are processed automatically by Bull workers.

## Database

The backend connects to your existing PostgreSQL database (Supabase). All tables and relationships are already configured.

## Extending the Backend

### Adding a New Module

1. Generate module:
   ```bash
   nest g module moduleName
   nest g controller moduleName
   nest g service moduleName
   ```

2. Implement CRUD operations in the service
3. Add authentication guards to the controller
4. Import module in `app.module.ts`

### Adding Background Jobs

1. Register queue in module:
   ```typescript
   BullModule.registerQueue({ name: 'queue-name' })
   ```

2. Create processor:
   ```typescript
   @Processor('queue-name')
   export class MyProcessor {
     @Process('job-name')
     async handleJob(job: Job) {
       // Process job
     }
   }
   ```

3. Add jobs to queue in service

## Production Deployment

### Using Docker

```bash
docker-compose -f docker-compose.yml up -d
```

### Manual Deployment

1. Build:
   ```bash
   npm run build
   ```

2. Start:
   ```bash
   NODE_ENV=production npm run start:prod
   ```

### Environment Variables for Production

- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure proper CORS origins
- Use connection pooling for database
- Set up Redis cluster for high availability

## Monitoring

- Health check: `GET /api/health` (you can add this)
- Logs are output to console
- Use PM2 or similar for process management

## Security

- JWT tokens expire in 7 days (configurable)
- Passwords hashed with bcrypt
- CORS configured for your frontend
- Input validation with class-validator
- SQL injection protection via Supabase client

## Frontend Integration

Update your frontend API calls to use:
```typescript
const API_URL = 'http://localhost:5000/api';

// Login
const response = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Authenticated requests
const response = await fetch(`${API_URL}/leads`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Support

For issues or questions, check the API documentation at `/api/docs` when the server is running.
