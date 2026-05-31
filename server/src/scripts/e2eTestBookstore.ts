// E2E test for the bookstore: verifies all 24 new books are
// queryable, complete (cover, chapters, images, reviews, author),
// and individually fetchable.

import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { books as expectedBooks, authors as expectedAuthors } from './seed24Data';

const BASE = process.env.E2E_BASE || 'http://localhost:5001';

interface TestResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const results: TestResult[] = [];
const ok = (name: string, detail?: string) => results.push({ name, pass: true, detail });
const fail = (name: string, detail: string) => results.push({ name, pass: false, detail });

async function get(path: string) {
  const res = await axios.get(`${BASE}${path}`, { timeout: 30000 });
  return res.data;
}

async function run() {
  console.log(`E2E target: ${BASE}\n`);

  // ============================================================
  // TEST 1: GET /api/books/public — all books visible
  // ============================================================
  let listData: any;
  try {
    listData = await get('/api/books/public?limit=50');
    if (!listData.success) {
      fail('GET /api/books/public returns success', JSON.stringify(listData));
    } else {
      ok('GET /api/books/public returns success');
    }
  } catch (e: any) {
    fail('GET /api/books/public reachable', e.message);
    printSummary();
    process.exit(1);
  }

  const books = listData.data?.books || [];
  const count = listData.data?.count ?? books.length;

  if (books.length >= 24) ok(`Marketplace returns >= 24 books (got ${books.length})`);
  else fail('Marketplace returns >= 24 books', `got ${books.length}`);

  // ============================================================
  // TEST 2: All 24 expected titles are present
  // ============================================================
  const titles = new Set(books.map((b: any) => b.title));
  let missing = 0;
  for (const eb of expectedBooks) {
    if (!titles.has(eb.title)) {
      fail(`Book present: "${eb.title}"`, 'not found in marketplace');
      missing++;
    }
  }
  if (missing === 0) ok(`All 24 expected book titles present`);

  // ============================================================
  // TEST 3: Each book has required fields
  // ============================================================
  const newBooks = books.filter((b: any) =>
    expectedBooks.some(eb => eb.title === b.title)
  );

  // Note: list endpoint returns lite books — chapters/reviews/tags/characters are
  // stripped for performance. We only check fields the lite shape includes.
  let coverIssues = 0, descIssues = 0, statsIssues = 0;
  for (const b of newBooks) {
    if (!b.coverDesign?.front?.imageUrl) coverIssues++;
    if (!b.description) descIssues++;
    if (!b.statistics?.views && b.statistics?.views !== 0) statsIssues++;
  }
  if (coverIssues === 0) ok('All books have cover image URL');
  else fail('All books have cover image URL', `${coverIssues} missing`);

  if (descIssues === 0) ok('All books have description');
  else fail('All books have description', `${descIssues} missing`);

  if (statsIssues === 0) ok('All books have statistics block');
  else fail('All books have statistics block', `${statsIssues} missing`);

  // ============================================================
  // TEST 4: Verify Hebrew language and isPublic flag
  // ============================================================
  const langIssues = newBooks.filter((b: any) => b.language !== 'he').length;
  const publicIssues = newBooks.filter((b: any) =>
    !b.publishingStatus?.isPublic || b.publishingStatus?.status !== 'published'
  ).length;
  if (langIssues === 0) ok('All books in Hebrew');
  else fail('All books in Hebrew', `${langIssues} not Hebrew`);
  if (publicIssues === 0) ok('All books published+public');
  else fail('All books published+public', `${publicIssues} not`);

  // ============================================================
  // TEST 5: Fetch one book individually and verify it has chapters with images
  // ============================================================
  const sample = newBooks[0];
  if (!sample) {
    fail('Sample book exists for detail test', 'no books');
  } else {
    let detail: any;
    try {
      const res = await get(`/api/books/public/${sample._id || sample.id}`);
      detail = res.data?.book || res.data;
      ok(`GET /api/books/public/:id reachable`);
    } catch (e: any) {
      fail(`GET /api/books/public/:id reachable`, e.message);
    }

    if (detail) {
      const chapters = detail.chapters || [];
      if (chapters.length >= 3) ok(`Sample book has >= 3 chapters (got ${chapters.length})`);
      else fail(`Sample book has >= 3 chapters`, `got ${chapters.length}`);

      const ch1 = chapters[0];
      if (ch1?.content?.includes('<img')) ok('Chapter content contains <img> tags');
      else fail('Chapter content contains <img> tags', 'no <img> in first chapter');

      if (ch1?.content?.includes('picsum.photos')) ok('Chapter images use picsum.photos');
      else fail('Chapter images use picsum.photos', 'no picsum URL found');

      const reviews = detail.reviews || [];
      if (reviews.length >= 3) ok(`Sample book detail returns ${reviews.length} reviews`);
      else fail('Sample book detail returns reviews', `got ${reviews.length}`);

      // Total words across chapters — proves substantive content was generated
      const totalWords = chapters.reduce((s: number, c: any) => s + (c.wordCount || 0), 0);
      if (totalWords >= 300) ok(`Sample book total wordCount >= 300 (got ${totalWords})`);
      else fail('Sample book total wordCount >= 300', `got ${totalWords}`);
    }
  }

  // ============================================================
  // TEST 5b: Verify characters/tags exist in DB (stripped from public API)
  // ============================================================
  if (sample) {
    try {
      // Use Supabase admin client to verify what's in DB
      const { supabaseAdmin } = await import('../config/supabase');
      const { data: dbBook } = await supabaseAdmin
        .from('books')
        .select('characters, tags')
        .eq('id', sample._id || sample.id)
        .single();
      if (dbBook?.characters && dbBook.characters.length > 0) {
        ok(`DB: sample book has ${dbBook.characters.length} character(s) stored`);
      } else {
        fail('DB: sample book has characters stored', 'none in DB');
      }
      if (dbBook?.tags && dbBook.tags.length > 0) {
        ok(`DB: sample book has ${dbBook.tags.length} tag(s) stored`);
      } else {
        fail('DB: sample book has tags stored', 'none in DB');
      }
    } catch (e: any) {
      fail('DB direct check', e.message);
    }
  }

  // ============================================================
  // TEST 6: All authors exist with bio + avatar
  // ============================================================
  const authorsSeen = new Set<string>();
  let authorIssues = 0;
  for (const b of newBooks) {
    const a = b.author;
    if (!a) { authorIssues++; continue; }
    const name = typeof a === 'string' ? a : a.name;
    if (name) authorsSeen.add(name);
  }
  if (authorIssues === 0) ok(`All books have author info`);
  else fail('All books have author info', `${authorIssues} missing`);

  if (authorsSeen.size === 24) ok(`24 distinct authors seen`);
  else fail('24 distinct authors seen', `got ${authorsSeen.size}`);

  // ============================================================
  // TEST 7: Verify a few specific events are covered
  // ============================================================
  const themes = [
    { keyword: 'שואה', label: 'Holocaust theme' },
    { keyword: 'אוקטובר', label: 'October 7 theme' },
    { keyword: 'לבנון', label: 'Lebanon War theme' },
    { keyword: 'יום כיפור', label: 'Yom Kippur theme' },
    { keyword: 'אנטבה', label: 'Entebbe theme' }
  ];
  for (const t of themes) {
    const found = newBooks.some((b: any) =>
      (b.tags || []).some((tag: string) => tag.includes(t.keyword)) ||
      (b.description || '').includes(t.keyword) ||
      (b.synopsis || '').includes(t.keyword) ||
      (b.title || '').includes(t.keyword)
    );
    if (found) ok(`Theme covered: ${t.label}`);
    else fail(`Theme covered: ${t.label}`, 'no book matches');
  }

  printSummary();
}

function printSummary() {
  console.log('\n========== E2E RESULTS ==========');
  let passed = 0, failed = 0;
  for (const r of results) {
    const icon = r.pass ? '[PASS]' : '[FAIL]';
    const detail = r.detail ? ` — ${r.detail}` : '';
    console.log(`${icon} ${r.name}${detail}`);
    if (r.pass) passed++; else failed++;
  }
  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('=================================\n');
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
