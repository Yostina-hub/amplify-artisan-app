#!/bin/bash

# Rollback script to restore database from backup

set -e

echo "🔄 Database Rollback Utility"
echo "============================"

# List available backups
echo "📋 Available backups:"
ls -1t backup_*.sql 2>/dev/null || echo "No backups found"

read -p "Enter backup filename to restore (e.g., backup_20250104_120000.sql): " BACKUP_FILE

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will restore the database to the state in $BACKUP_FILE"
echo "⚠️  All current data changes since that backup will be LOST!"
read -p "Are you sure you want to continue? (yes/NO): " -r
echo

if [[ ! $REPLY == "yes" ]]; then
  echo "❌ Rollback cancelled"
  exit 0
fi

if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not found in environment"
  read -p "Enter your DATABASE_URL: " DATABASE_URL
  export DATABASE_URL
fi

echo "🔄 Restoring database from $BACKUP_FILE..."
psql "$DATABASE_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Database restored successfully!"
  echo "🔄 Please restart your web server"
else
  echo "❌ Restore failed!"
  exit 1
fi
