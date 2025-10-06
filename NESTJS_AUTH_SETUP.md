# ✅ NestJS Authentication Setup Complete

Your frontend now authenticates through the **NestJS backend** instead of Supabase Auth directly.

## What Changed

✅ **New API Client** (`src/lib/api-client.ts`)
- Handles all HTTP requests to NestJS backend
- Manages JWT tokens in localStorage
- Provides typed methods for auth operations

✅ **Updated useAuth Hook** (`src/hooks/useAuth.tsx`)
- Now uses NestJS backend endpoints
- Stores JWT token in localStorage
- Maintains same interface for compatibility

✅ **Environment Variables** (`.env`)
- Added `VITE_API_URL=http://localhost:5000/api`

## How to Test

### 1. Start the Backend

```bash
cd backend
npm install
npm run start:dev
```

Backend runs on: `http://localhost:5000`

### 2. Start the Frontend

```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 3. Test Login

Since you're using a fresh NestJS backend, you'll need to create a user first.

**Option A: Register through UI**
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Create a new account

**Option B: Create user via API**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Password123!",
    "full_name": "Admin User"
  }'
```

**Option C: Create user directly in database**

You'll need to insert into the `users` table in your Supabase database.

## Authentication Flow

### Login
```
1. User enters email/password
2. Frontend calls: POST /api/auth/login
3. Backend validates credentials
4. Backend returns JWT token
5. Frontend stores token in localStorage
6. Frontend loads user data
```

### Subsequent Requests
```
All API calls include:
Authorization: Bearer {jwt_token}
```

### Logout
```
1. User clicks logout
2. Frontend removes token from localStorage
3. User redirected to login
```

## API Endpoints

### Auth Endpoints (Public)
```
POST   /api/auth/register     # Create new user
POST   /api/auth/login        # Login
POST   /api/auth/reset-password
```

### Auth Endpoints (Protected)
```
GET    /api/auth/me           # Get current user
POST   /api/auth/change-password
```

### All Other Endpoints (Protected)
```
GET    /api/leads
GET    /api/contacts
GET    /api/products
... (32+ modules)
```

## Data Flow

### Before (Supabase Auth)
```
Frontend → Supabase Auth → Database
```

### After (NestJS Auth)
```
Frontend → NestJS Backend → Database
```

## Token Storage

JWT tokens are stored in `localStorage` as `auth_token`.

To check your token:
```javascript
console.log(localStorage.getItem('auth_token'));
```

To clear token (logout):
```javascript
localStorage.removeItem('auth_token');
```

## Creating Admin Users

To give users admin access, you need to add records to the `user_roles` table:

```sql
-- Make user a super admin (can access everything)
INSERT INTO user_roles (user_id, role, company_id)
VALUES ('user-uuid-here', 'admin', NULL);

-- Make user a company admin
INSERT INTO user_roles (user_id, role, company_id)
VALUES ('user-uuid-here', 'admin', 'company-uuid-here');

-- Regular user
INSERT INTO user_roles (user_id, role, company_id)
VALUES ('user-uuid-here', 'user', 'company-uuid-here');
```

## Troubleshooting

### "Cannot connect to backend"
- Ensure backend is running: `cd backend && npm run start:dev`
- Check backend URL in `.env`: `VITE_API_URL=http://localhost:5000/api`
- Restart frontend dev server after changing .env

### "Invalid credentials"
- Make sure user exists in database
- Check password is correct
- Verify `users` table exists

### "401 Unauthorized"
- Token might be expired or invalid
- Try logging out and back in
- Check token in localStorage

### Backend not starting
- Ensure Redis is running: `docker run -d -p 6379:6379 redis:7-alpine`
- Check `.env` file exists in `backend/` folder
- Run `npm install` in backend folder

## Security Notes

### JWT Token
- Stored in localStorage
- Expires after 7 days (configurable)
- Includes user ID and basic info

### Passwords
- Hashed with bcrypt (10 rounds)
- Never stored in plain text
- Never returned in API responses

### API Security
- All endpoints require JWT (except auth endpoints)
- Company-level data isolation
- Role-based access control

## Next Steps

1. **Create your first user** via register or API
2. **Add user roles** to control access
3. **Test login** through the UI
4. **Access protected pages** (Dashboard, Leads, etc.)

## Development Tips

### Debug API Calls
Open browser console and network tab to see:
- API requests
- JWT token in headers
- Response data
- Errors

### Test with Curl
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}' \
  | jq -r '.access_token')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/leads
```

### API Documentation
Visit: `http://localhost:5000/api/docs`

Swagger UI with:
- All endpoints documented
- Try-it-out functionality
- Request/response examples

## Summary

✅ Frontend now uses NestJS backend for auth
✅ JWT tokens stored in localStorage
✅ All API calls go through NestJS backend
✅ Build successful
✅ Ready to test!

**Start both servers and try logging in!** 🚀
