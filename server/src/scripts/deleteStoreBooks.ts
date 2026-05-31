import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

const KEEP_TITLES = ['מסע אל הלא נודע', 'לבבות שבורים'];

async function deleteStoreBooks() {
  const { data: books, error } = await supabaseAdmin
    .from('books')
    .select('id, title, author_id, publishing_status');

  if (error) {
    console.error('Fetch error:', error);
    process.exit(1);
  }

  const publicPublished = (books || []).filter((b: any) =>
    b.publishing_status?.status === 'published' &&
    b.publishing_status?.isPublic === true
  );

  console.log(`Found ${publicPublished.length} published+public books in store.`);

  const toDelete = publicPublished.filter((b: any) => !KEEP_TITLES.includes(b.title));
  const toKeep = publicPublished.filter((b: any) => KEEP_TITLES.includes(b.title));

  console.log(`\nKeeping ${toKeep.length}:`);
  toKeep.forEach((b: any) => console.log(`  - ${b.title} [${b.id}]`));

  console.log(`\nDeleting ${toDelete.length}:`);
  toDelete.forEach((b: any) => console.log(`  - ${b.title} [${b.id}]`));

  if (toDelete.length === 0) {
    console.log('\nNothing to delete.');
    return;
  }

  console.log('\nDeleting books...');
  const ids = toDelete.map((b: any) => b.id);
  const { error: delError } = await supabaseAdmin
    .from('books')
    .delete()
    .in('id', ids);

  if (delError) {
    console.error('Delete error:', delError);
    process.exit(1);
  }

  // Also delete the authors of those books if they have no other books
  const authorIds = Array.from(new Set(toDelete.map((b: any) => b.author_id)));
  console.log(`\nChecking ${authorIds.length} author(s) for orphan cleanup...`);

  for (const aid of authorIds) {
    const { count } = await supabaseAdmin
      .from('books')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', aid);

    if ((count ?? 0) === 0) {
      // Get email to make sure we only delete seeded authors
      const { data: u } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .eq('id', aid)
        .single();

      if (u && (u.email?.endsWith('@mestory.com') || u.email?.includes('seed'))) {
        await supabaseAdmin.from('users').delete().eq('id', aid);
        console.log(`  Deleted orphan seed author: ${u.name} (${u.email})`);
      } else {
        console.log(`  Skipped (real user): ${u?.name} (${u?.email})`);
      }
    }
  }

  console.log('\nDone.');
}

deleteStoreBooks().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
