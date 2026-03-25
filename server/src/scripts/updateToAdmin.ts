/**
 * Script to update user email and make admin
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabaseAdmin } from '../config/supabase';

const OLD_EMAIL = 'maorargaman22@gmail.com';
const NEW_EMAIL = 'mestory@mestoryapp.com';

async function updateToAdmin() {
  console.log(`🔧 Updating ${OLD_EMAIL} to ${NEW_EMAIL} with ADMIN role...`);

  try {
    // Update email and role
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        email: NEW_EMAIL,
        role: 'ADMIN'
      })
      .eq('email', OLD_EMAIL)
      .select();

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Success!');
      console.log(`   Email: ${data[0].email}`);
      console.log(`   Role: ${data[0].role}`);
      console.log(`\n🎉 You can now login with ${NEW_EMAIL} and access /admin`);
    } else {
      console.log('⚠️ No rows updated. User may not exist.');
    }

  } catch (error: any) {
    console.error('❌ Script error:', error.message);
  }

  process.exit(0);
}

updateToAdmin();
