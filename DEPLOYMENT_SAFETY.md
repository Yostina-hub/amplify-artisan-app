# Safe Deployment Guide

## Before Deployment

The deployment script **automatically creates a database backup** before making any changes.

## Deploy with Automatic Backup

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This will:
1. ✅ Create timestamped database backup (e.g., `backup_20250104_120000.sql`)
2. ✅ Run database migrations (adds new tables only)
3. ✅ Install dependencies
4. ✅ Build frontend
5. ✅ Restart web server

## If Something Goes Wrong - Rollback

```bash
chmod +x scripts/rollback.sh
./scripts/rollback.sh
```

The rollback script will:
1. Show you all available backups
2. Let you choose which backup to restore
3. Restore your database to that exact state

## Database Changes Summary

All changes are **additive only** - no existing data is modified:

### New Tables Added:
- `api_integrations` - Store API integration configs
- `api_integration_fields` - Custom fields for integrations
- `api_integration_logs` - Activity logs for API calls

### Existing Data:
- ✅ All existing tables unchanged
- ✅ All existing columns unchanged
- ✅ All existing data preserved

## Backup Location

Backups are stored in the project root directory with timestamp:
```
backup_20250104_120000.sql
backup_20250104_150000.sql
```

Keep at least 3 recent backups for safety.

## Manual Backup (Optional)

If you want to create a backup without deploying:

```bash
pg_dump $DATABASE_URL > backup_manual_$(date +%Y%m%d_%H%M%S).sql
```
