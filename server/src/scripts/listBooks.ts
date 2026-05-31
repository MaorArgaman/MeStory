import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function listBooks() {
  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select('id, title, author_id, language, publishing_status, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`\nTotal books: ${books?.length || 0}\n`);
  books?.forEach((b: any, i: number) => {
    const status = b.publishing_status?.status || 'unknown';
    const isPublic = b.publishing_status?.isPublic ? 'public' : 'private';
    console.log(`${i + 1}. [${b.id}]`);
    console.log(`   Title: ${b.title}`);
    console.log(`   Author: ${b.author_id}`);
    console.log(`   Lang: ${b.language} | Status: ${status}/${isPublic}`);
    console.log(`   Created: ${b.created_at}`);
    console.log('');
  });
}

listBooks().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
