/**
 * Add translations column to books table via Supabase REST API
 */

import dotenv from 'dotenv';
dotenv.config();

async function addTranslationsColumn() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('Adding translations column to books table...\n');

  // Try using the PostgREST query endpoint to check current schema
  try {
    // First, try to read a book to see current structure
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/books?select=id,translations&limit=1`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    if (checkResponse.ok) {
      const data = await checkResponse.json();
      console.log('Column check response:', data);

      if (data[0] && 'translations' in data[0]) {
        console.log('\nTranslations column already exists!');
        process.exit(0);
      }
    } else {
      const errorText = await checkResponse.text();
      console.log('Check response status:', checkResponse.status);
      console.log('Check response:', errorText);

      if (errorText.includes('translations') && errorText.includes('does not exist')) {
        console.log('\nConfirmed: translations column does not exist.');
      }
    }
  } catch (err: any) {
    console.log('Check error:', err.message);
  }

  // Try to use the SQL execution via Supabase edge function or management API
  // Note: Standard Supabase REST API doesn't support ALTER TABLE
  // We'll need to use the database connection directly

  console.log('\n-------------------------------------------');
  console.log('The translations column needs to be added manually.');
  console.log('Please run this SQL in Supabase Dashboard:');
  console.log('');
  console.log('  ALTER TABLE books ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL;');
  console.log('');
  console.log('Go to: https://supabase.com/dashboard/project/nuuspxrkqlhxwpicsbsh/sql');
  console.log('-------------------------------------------\n');

  // Let me try with the pg library if available
  try {
    // Dynamic import of pg
    const { default: pkg } = await import('pg');
    const { Pool } = pkg;

    // Supabase database connection
    const projectRef = 'nuuspxrkqlhxwpicsbsh';

    console.log('Attempting direct PostgreSQL connection...');
    console.log('Note: This requires the database password from Supabase Dashboard.');
    console.log('Settings -> Database -> Connection string\n');

  } catch (err: any) {
    console.log('pg library not available:', err.message);
  }

  process.exit(0);
}

addTranslationsColumn();
