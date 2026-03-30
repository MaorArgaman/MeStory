/**
 * Check if translations column exists and try alternative methods to add it
 */

import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function main() {
  console.log('Checking if translations column exists...\n');

  // Try to insert a test value to see if the column exists
  try {
    // First, get a book to test with
    const { data: books, error: fetchError } = await supabaseAdmin
      .from('books')
      .select('id, title')
      .limit(1);

    if (fetchError) {
      console.log('Error fetching books:', fetchError.message);
      return;
    }

    if (!books || books.length === 0) {
      console.log('No books found to test with.');
      return;
    }

    const testBook = books[0];
    console.log(`Testing with book: "${testBook.title}" (${testBook.id})\n`);

    // Try to update with translations
    const testTranslation = {
      english: {
        title: 'Test Translation',
        chapters: [],
        generatedAt: new Date().toISOString()
      }
    };

    const { error: updateError } = await supabaseAdmin
      .from('books')
      .update({ translations: testTranslation })
      .eq('id', testBook.id);

    if (updateError) {
      if (updateError.message.includes('translations') && updateError.message.includes('does not exist')) {
        console.log('CONFIRMED: translations column does NOT exist.\n');
        console.log('Please add it manually in Supabase Dashboard:\n');
        console.log('1. Go to: https://supabase.com/dashboard/project/nuuspxrkqlhxwpicsbsh/sql');
        console.log('2. Run: ALTER TABLE books ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL;');
      } else {
        console.log('Update error:', updateError.message);
      }
    } else {
      console.log('SUCCESS! Translations column exists and update worked!');

      // Clear the test data
      await supabaseAdmin
        .from('books')
        .update({ translations: null })
        .eq('id', testBook.id);

      console.log('Test data cleared. Ready to run migration!');
    }
  } catch (err: any) {
    console.log('Error:', err.message);
  }

  process.exit(0);
}

main();
