#!/bin/bash

# Deployment script for self-hosted SocialHub
# This script handles database migrations and frontend build automatically

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Step 1: Backup database before any changes
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
echo "💾 Creating database backup: $BACKUP_FILE"

if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not found in environment"
  read -p "Enter your DATABASE_URL: " DATABASE_URL
  export DATABASE_URL
fi

pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Database backup created: $BACKUP_FILE"
  echo "📍 Backup location: $(pwd)/$BACKUP_FILE"
else
  echo "❌ Database backup failed!"
  read -p "Continue without backup? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Step 2: Run database migrations
echo "📦 Running database migrations..."
node scripts/migrate.js

if [ $? -ne 0 ]; then
  echo "❌ Database migration failed!"
  exit 1
fi

echo "✅ Database migrations completed"

# Step 2: Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Step 3: Build frontend
echo "🔨 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build completed"

# Step 4: Restart web server (adjust based on your setup)
echo "🔄 Restarting web server..."
if command -v systemctl &> /dev/null; then
  sudo systemctl restart nginx || true
elif command -v service &> /dev/null; then
  sudo service nginx restart || true
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should now be updated at https://socialhub.gubatech.com/"
