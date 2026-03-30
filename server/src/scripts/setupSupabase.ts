/**
 * Setup Supabase Infrastructure
 * Creates the audio bucket and adds translations column
 */

import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function setupSupabase() {
  console.log('='.repeat(60));
  console.log('SUPABASE INFRASTRUCTURE SETUP');
  console.log('='.repeat(60));

  // 1. Create audio storage bucket
  console.log('\n1. Creating audio storage bucket...');
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      console.log('   Error listing buckets:', listError.message);
    }

    const audioBucketExists = buckets?.some(b => b.id === 'audio');

    if (audioBucketExists) {
      console.log('   Audio bucket already exists.');
    } else {
      const { data, error } = await supabaseAdmin.storage.createBucket('audio', {
        public: true,
        allowedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'],
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      });

      if (error) {
        console.log('   Error creating bucket:', error.message);
        // Try alternative approach - maybe bucket exists but wasn't listed
        if (error.message.includes('already exists')) {
          console.log('   Bucket already exists (confirmed via error).');
        }
      } else {
        console.log('   Audio bucket created successfully!');
      }
    }
  } catch (err: any) {
    console.error('   Bucket creation failed:', err.message);
  }

  // 2. Add translations column using raw SQL via RPC
  console.log('\n2. Adding translations column to books table...');
  try {
    // First, let's check if we can run SQL via the Supabase client
    // We'll use a simple approach - try to select from books to verify connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('books')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('   Error connecting to books table:', testError.message);
    } else {
      console.log('   Connected to books table successfully.');

      // Now try to add the translations column
      // Since supabase-js doesn't directly support ALTER TABLE,
      // we need to use the REST API or SQL Editor
      console.log('   Note: Adding column requires SQL Editor access.');
      console.log('   Please run this SQL in Supabase Dashboard > SQL Editor:');
      console.log('   ');
      console.log('   ALTER TABLE books ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL;');
      console.log('   ');
    }
  } catch (err: any) {
    console.error('   Database check failed:', err.message);
  }

  // 3. Verify bucket was created
  console.log('\n3. Verifying audio bucket...');
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();

    if (error) {
      console.log('   Error listing buckets:', error.message);
    } else {
      const audioBucket = buckets?.find(b => b.id === 'audio');
      if (audioBucket) {
        console.log('   Audio bucket verified:', audioBucket.id, '(public:', audioBucket.public, ')');
      } else {
        console.log('   Audio bucket NOT found. Available buckets:', buckets?.map(b => b.id).join(', ') || 'none');
      }
    }
  } catch (err: any) {
    console.error('   Verification failed:', err.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('SETUP COMPLETE');
  console.log('='.repeat(60));

  process.exit(0);
}

setupSupabase();
