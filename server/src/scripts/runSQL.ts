/**
 * Run SQL via Supabase SQL API
 * Uses the undocumented Supabase SQL endpoint
 */

import dotenv from 'dotenv';
dotenv.config();

async function runSQL(sql: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  // Try different endpoints that might accept SQL

  // 1. Try the sql endpoint (used by Supabase Studio)
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  const sqlUrl = `https://${projectRef}.supabase.co/pg/sql`;

  console.log(`Attempting SQL execution at: ${sqlUrl}`);
  console.log(`SQL: ${sql}\n`);

  try {
    const response = await fetch(sqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ query: sql }),
    });

    const text = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response: ${text.substring(0, 500)}`);

    if (response.ok) {
      return JSON.parse(text);
    }
  } catch (err: any) {
    console.log(`Error: ${err.message}`);
  }

  // 2. Try the graphql endpoint
  console.log('\nTrying alternative approach...');

  // 3. Try direct pg_query RPC if it exists
  try {
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/pg_query`;
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ query: sql }),
    });

    console.log(`RPC response status: ${rpcResponse.status}`);
    const rpcText = await rpcResponse.text();
    console.log(`RPC response: ${rpcText.substring(0, 500)}`);
  } catch (err: any) {
    console.log(`RPC error: ${err.message}`);
  }

  return null;
}

async function main() {
  console.log('='.repeat(60));
  console.log('ATTEMPTING TO ADD TRANSLATIONS COLUMN');
  console.log('='.repeat(60));
  console.log('');

  // First, check current schema
  const schemaResult = await runSQL(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'books'
    ORDER BY ordinal_position;
  `);

  if (schemaResult) {
    console.log('\nCurrent books table schema:', schemaResult);
  }

  // Try to add the column
  console.log('\n' + '-'.repeat(60));
  const alterResult = await runSQL(`
    ALTER TABLE books
    ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL;
  `);

  if (alterResult) {
    console.log('\nColumn added successfully!');
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('MANUAL ACTION REQUIRED');
    console.log('='.repeat(60));
    console.log('');
    console.log('Please add the translations column manually:');
    console.log('');
    console.log('1. Go to Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/nuuspxrkqlhxwpicsbsh/sql');
    console.log('');
    console.log('2. Run this SQL:');
    console.log('   ALTER TABLE books ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL;');
    console.log('');
  }

  process.exit(0);
}

main();
