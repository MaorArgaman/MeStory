/**
 * Script to make a user an admin
 * Run with: npx ts-node src/scripts/makeAdmin.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabaseAdmin } from '../config/supabase';

const EMAIL = 'mestory@mestoryapp.com';

async function makeAdmin() {
  console.log(`🔧 Making ${EMAIL} an admin...`);

  try {
    // First, find the user
    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('email', EMAIL)
      .single();

    if (findError) {
      console.error('❌ Error finding user:', findError.message);

      // List all users to help debug
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('email, role')
        .limit(10);

      console.log('\n📋 Existing users:');
      allUsers?.forEach(u => console.log(`  - ${u.email} (${u.role})`));
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   Current role: ${user.role}`);

    // Update to admin
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ role: 'ADMIN' })
      .eq('email', EMAIL);

    if (updateError) {
      console.error('❌ Error updating role:', updateError.message);
      return;
    }

    console.log(`✅ Successfully updated ${EMAIL} to ADMIN role!`);
    console.log(`\n🎉 You can now access /admin in the app.`);

  } catch (error: any) {
    console.error('❌ Script error:', error.message);
  }

  process.exit(0);
}

makeAdmin();
