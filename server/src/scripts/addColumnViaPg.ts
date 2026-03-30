/**
 * Add translations column using pg library with pooler connection
 */

import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

async function addTranslationsColumn() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectRef = 'nuuspxrkqlhxwpicsbsh';

  console.log('='.repeat(60));
  console.log('ADDING TRANSLATIONS COLUMN VIA DIRECT CONNECTION');
  console.log('='.repeat(60));

  // Try different connection methods
  const connectionStrings = [
    // Transaction pooler with service role key as password
    `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    // Session pooler
    `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    // Direct connection (may not work from external network)
    `postgresql://postgres:${serviceRoleKey}@db.${projectRef}.supabase.co:5432/postgres`,
  ];

  for (const connStr of connectionStrings) {
    const maskedStr = connStr.replace(serviceRoleKey!, '***');
    console.log(`\nTrying: ${maskedStr.substring(0, 80)}...`);

    const pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      const client = await pool.connect();
      console.log('Connected successfully!');

      // Check if column exists
      const checkResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'books' AND column_name = 'translations'
      `);

      if (checkResult.rows.length > 0) {
        console.log('Translations column already exists!');
        client.release();
        await pool.end();
        process.exit(0);
      }

      // Add the column
      console.log('Adding translations column...');
      await client.query(`
        ALTER TABLE books
        ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL
      `);

      console.log('SUCCESS! Translations column added.');
      client.release();
      await pool.end();
      process.exit(0);
    } catch (err: any) {
      console.log(`Failed: ${err.message}`);
      await pool.end();
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('ALL CONNECTION ATTEMPTS FAILED');
  console.log('='.repeat(60));
  console.log('\nPlease run this SQL manually in Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/nuuspxrkqlhxwpicsbsh/sql');
  console.log('');
  console.log('ALTER TABLE books ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL;');
  console.log('');

  process.exit(1);
}

addTranslationsColumn();
