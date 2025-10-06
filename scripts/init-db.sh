#!/bin/bash

set -e

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=your-super-secret-and-long-postgres-password psql -h localhost -U postgres -d postgres -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is ready!"

echo "Running migrations..."
for migration in supabase/migrations/*.sql; do
  echo "Applying $migration..."
  PGPASSWORD=your-super-secret-and-long-postgres-password psql -h localhost -U postgres -d postgres -f "$migration"
done

echo "Database initialized successfully!"
