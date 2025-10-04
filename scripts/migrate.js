#!/usr/bin/env node

import { readFileSync } from 'fs';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please set DATABASE_URL in .env.local file');
  console.error('Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
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
    console.log('🎉 Your database is ready!');
    
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
