#!/usr/bin/env node

import { readFileSync } from 'fs';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local (if exists) or .env
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

// Check if running on Lovable Cloud (Supabase)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
if (SUPABASE_URL && SUPABASE_URL.includes('supabase.co')) {
  console.error('❌ ERROR: This script is for SELF-HOSTED deployments only!');
  console.error('');
  console.error('You are using Lovable Cloud (Supabase).');
  console.error('For Lovable Cloud, use the Supabase migration tool via the Lovable UI.');
  console.error('');
  console.error('This script would conflict with your existing Supabase setup.');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('');
  console.error('For SELF-HOSTED deployment:');
  console.error('1. Copy .env.local.example to .env.local');
  console.error('2. Comment out VITE_SUPABASE_URL');
  console.error('3. Set DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
  console.error('');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('📄 Setting up auth schema...');
    const authSetupSQL = readFileSync(
      join(__dirname, 'setup-auth.sql'),
      'utf8'
    );
    await client.query(authSetupSQL);
    console.log('✅ Auth schema created');

    console.log('📄 Reading migration file...');
    const migrationSQL = readFileSync(
      join(__dirname, '..', 'database-migration.sql'),
      'utf8'
    );

    console.log('🚀 Running database migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Database migration completed successfully!');
    console.log('');
    console.log('📊 Database schema created:');
    console.log('  - All tables created');
    console.log('  - Views created');
    console.log('  - Functions created');
    console.log('  - Triggers created');
    console.log('  - Indexes created');
    console.log('');

    // Seed super admin user
    console.log('👤 Seeding super admin user...');
    const seedSQL = readFileSync(
      join(__dirname, 'seed-admin.sql'),
      'utf8'
    );
    await client.query(seedSQL);
    console.log('✅ Super admin user seeded');
    console.log('');
    console.log('🎉 Your database is ready!');
    console.log('');
    console.log('🔐 Default Super Admin Credentials:');
    console.log('   Email: abel.birara@gmail.com');
    console.log('   Password: Admin@2025');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('💡 If tables already exist, this is expected.');
    console.error('   The database might already be migrated.');
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
