/**
 * Remove seeded / AI-generated demo accounts and their books from the store.
 *
 * SAFE BY DESIGN:
 *   - Targets ONLY the 3 demo email patterns the seed scripts use. A real
 *     user can never match these, so real accounts/books are never touched.
 *       %@mestory-demo.com   (seed24Data — the 24 bookstore authors)
 *       demo@mestory.com     (seedSampleBook)
 *       author@mestory.com   (seedPaidBook)
 *   - DRY RUN by default: prints exactly what WOULD be deleted, deletes
 *     nothing. Re-run with `--confirm` to actually delete.
 *
 *   npx ts-node src/scripts/cleanupDemoData.ts            # preview only
 *   npx ts-node src/scripts/cleanupDemoData.ts --confirm  # delete
 */
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

const CONFIRM = process.argv.includes('--confirm');

// PostgREST .or() uses * as the ilike wildcard (not %).
const DEMO_OR_FILTER =
  'email.ilike.*@mestory-demo.com,email.eq.demo@mestory.com,email.eq.author@mestory.com';

async function main() {
  console.log(
    CONFIRM
      ? '=== DELETE MODE (--confirm): demo data WILL be removed ==='
      : '=== DRY RUN: nothing will be deleted. Re-run with --confirm to delete ==='
  );

  // 1. Demo users (the ONLY thing we ever delete).
  const { data: demoUsers, error: uErr } = await supabaseAdmin
    .from('users')
    .select('id, email, name')
    .or(DEMO_OR_FILTER);
  if (uErr) {
    console.error('User fetch error:', uErr);
    process.exit(1);
  }
  const demoIds = (demoUsers || []).map((u: any) => u.id);

  const { count: totalUsers } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true });

  console.log(`\nDemo/seed users matched: ${demoIds.length}`);
  (demoUsers || []).forEach((u: any) =>
    console.log(`  - ${u.name} <${u.email}> [${u.id}]`)
  );
  console.log(
    `Real users that will be KEPT: ${(totalUsers || 0) - demoIds.length} (of ${totalUsers} total)`
  );

  // 2. Books authored by those demo users.
  let demoBooks: any[] = [];
  if (demoIds.length) {
    const { data: books, error: bErr } = await supabaseAdmin
      .from('books')
      .select('id, title, author_id, publishing_status')
      .in('author_id', demoIds);
    if (bErr) {
      console.error('Book fetch error:', bErr);
      process.exit(1);
    }
    demoBooks = books || [];
  }

  const { count: totalBooks } = await supabaseAdmin
    .from('books')
    .select('id', { count: 'exact', head: true });

  console.log(`\nBooks by demo users: ${demoBooks.length}`);
  demoBooks.forEach((b: any) =>
    console.log(
      `  - ${b.title} [${b.id}] (status: ${b.publishing_status?.status ?? 'n/a'})`
    )
  );
  console.log(
    `Real books that will be KEPT: ${(totalBooks || 0) - demoBooks.length} (of ${totalBooks} total)`
  );

  if (!CONFIRM) {
    console.log(
      '\nDRY RUN complete. Nothing was deleted. Re-run with --confirm to remove the above.'
    );
    return;
  }

  // 3. Delete: books first (so no author_id dangles), then the demo users.
  if (demoBooks.length) {
    const ids = demoBooks.map((b) => b.id);
    const { error } = await supabaseAdmin.from('books').delete().in('id', ids);
    if (error) {
      console.error('Book delete error:', error);
      process.exit(1);
    }
    console.log(`\nDeleted ${ids.length} demo books.`);
  }
  if (demoIds.length) {
    const { error } = await supabaseAdmin.from('users').delete().in('id', demoIds);
    if (error) {
      console.error('User delete error:', error);
      process.exit(1);
    }
    console.log(`Deleted ${demoIds.length} demo users.`);
  }
  console.log('\nDone. The store now contains only real users and real books.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
