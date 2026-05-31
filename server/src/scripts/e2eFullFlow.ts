/**
 * Full end-to-end test of the core MeStory flows, driven over HTTP against
 * a locally running server (default http://localhost:5001):
 *
 *   1. Auth          — register + login
 *   2. Writing       — create book, update chapters, fetch, list
 *   3. Design         — design-state, quick preview, full design-book,
 *                       apply-design, cover colors
 *   4. Auto-design    — status, generate (planner+critic), re-status,
 *                       export.docx (the "עימוד" typesetting feature)
 *   5. Export         — sync PDF, async PDF (+ job poll), DOCX, PDF-by-format
 *   6. Publish        — validation chain (negative) then positive publish
 *   7. Marketplace    — public list, public detail, like, social stats
 *
 * The test user is provisioned as ADMIN via the service-role key so credit
 * gating never blocks a flow and no credits are consumed. All test data is
 * deleted at the end (book row + user row), so the public marketplace is not
 * polluted. Set E2E_KEEP=1 to skip cleanup for debugging.
 *
 * Run:  npx ts-node --transpile-only src/scripts/e2eFullFlow.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import axios, { AxiosResponse } from 'axios';
import { supabaseAdmin } from '../config/supabase';

const BASE = process.env.E2E_BASE || 'http://localhost:5001';
const KEEP = process.env.E2E_KEEP === '1';
const AI_TIMEOUT = 250000; // AI/design/export calls can be slow (auto-design runs Claude planner+critic)

type Status = 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
interface Result {
  flow: string;
  name: string;
  status: Status;
  detail?: string;
  http?: number;
}
const results: Result[] = [];
function rec(flow: string, name: string, status: Status, detail?: string, http?: number) {
  results.push({ flow, name, status, detail, http });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️ ' : '⏭️ ';
  console.log(`${icon} [${flow}] ${name}${http ? ` (HTTP ${http})` : ''}${detail ? ` — ${detail}` : ''}`);
}

let TOKEN = '';
interface Req {
  status: number;
  ok: boolean;
  data: any;
  error?: string;
  headers?: any;
  raw?: AxiosResponse;
}
async function http(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  body?: any,
  opts: { auth?: boolean; timeout?: number; responseType?: 'json' | 'arraybuffer' } = {}
): Promise<Req> {
  const { auth = true, timeout = 30000, responseType = 'json' } = opts;
  try {
    const res = await axios.request({
      method,
      url: `${BASE}${path}`,
      data: body,
      timeout,
      responseType,
      headers: auth && TOKEN ? { Authorization: `Bearer ${TOKEN}` } : undefined,
      validateStatus: () => true,
    });
    return {
      status: res.status,
      ok: res.status >= 200 && res.status < 300,
      data: res.data,
      headers: res.headers,
      raw: res,
    };
  } catch (e: any) {
    return { status: 0, ok: false, data: null, error: e.message };
  }
}

function errText(r: Req): string {
  if (r.error) return r.error;
  if (r.data && typeof r.data === 'object') return r.data.error || r.data.message || JSON.stringify(r.data).slice(0, 200);
  if (typeof r.data === 'string') return r.data.slice(0, 200);
  return '';
}

const SUFFIX = `${Date.now()}`;
const TEST_EMAIL = `e2e.flow.${SUFFIX}@mestory.test`;
const TEST_PASSWORD = 'E2eTest!Pass123';
let USER_ID = '';
let BOOK_ID = '';
let designFromAI: any = null;

// ============================================================
async function setup() {
  // Register
  const reg = await http('post', '/api/auth/register', {
    name: 'E2E Flow Tester',
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  }, { auth: false });
  if (!reg.ok) {
    rec('Setup', 'Register test user', 'FAIL', errText(reg), reg.status);
    throw new Error('Cannot register test user — aborting');
  }
  USER_ID = reg.data?.data?.user?.id;
  rec('Setup', 'Register test user', 'PASS', `userId=${USER_ID}`);

  // Promote to admin + verify email + give credits (so plan/credit gates never block)
  const { error: upErr } = await supabaseAdmin
    .from('users')
    .update({
      role: 'PREMIUM',
      credits: 999999,
      email_verification: { isVerified: true, verifiedAt: new Date().toISOString() },
    })
    .eq('id', USER_ID);
  if (upErr) {
    rec('Setup', 'Provision premium role + credits', 'FAIL', upErr.message);
  } else {
    rec('Setup', 'Provision premium role + credits', 'PASS');
  }

  // Login (token must carry role=PREMIUM for requirePlan)
  const login = await http('post', '/api/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD }, { auth: false });
  if (!login.ok || !login.data?.data?.token) {
    rec('Setup', 'Login', 'FAIL', errText(login), login.status);
    throw new Error('Cannot login — aborting');
  }
  TOKEN = login.data.data.token;
  const role = login.data?.data?.user?.role;
  rec('Setup', 'Login', role === 'PREMIUM' ? 'PASS' : 'WARN', `role=${role}`);
}

// ============================================================
async function flowWriting() {
  const F = 'Writing';
  // Create
  const create = await http('post', '/api/books', {
    title: `סיפור הבדיקה ${SUFFIX}`,
    genre: 'memoir',
    description: 'ספר בדיקה אוטומטי מקצה לקצה',
    language: 'he',
  });
  if (!create.ok) {
    rec(F, 'POST /api/books (create)', 'FAIL', errText(create), create.status);
    throw new Error('Cannot create book — aborting flows that need a book');
  }
  BOOK_ID = create.data?.data?.id || create.data?.data?.book?.id;
  rec(F, 'POST /api/books (create)', BOOK_ID ? 'PASS' : 'FAIL', `bookId=${BOOK_ID}`, create.status);
  if (!BOOK_ID) throw new Error('No book id returned');

  // Update with chapters
  const chapters = [
    { title: 'פרק ראשון', content: '<p>' + 'זהו פרק הפתיחה של הסיפור. '.repeat(40) + '</p>', order: 0, wordCount: 120 },
    { title: 'פרק שני', content: '<p>' + 'ההמשך של המסע, מלא ברגעים מרגשים. '.repeat(40) + '</p>', order: 1, wordCount: 120 },
    { title: 'פרק שלישי', content: '<p>' + 'הסיום הגדול שמחבר את כל הקצוות. '.repeat(40) + '</p>', order: 2, wordCount: 120 },
  ];
  const upd = await http('put', `/api/books/${BOOK_ID}`, {
    chapters,
    statistics: { wordCount: 360, chapterCount: 3 },
  });
  rec(F, 'PUT /api/books/:id (save 3 chapters)', upd.ok ? 'PASS' : 'FAIL', errText(upd) || undefined, upd.status);

  // Get back & verify chapters persisted
  const get = await http('get', `/api/books/${BOOK_ID}`);
  const got = get.data?.data?.book || get.data?.data;
  const chCount = got?.chapters?.length ?? 0;
  rec(F, 'GET /api/books/:id (chapters persisted)', get.ok && chCount === 3 ? 'PASS' : 'FAIL',
    `chapters=${chCount}`, get.status);

  // List
  const list = await http('get', '/api/books');
  const books = list.data?.data?.books || list.data?.data || [];
  const present = Array.isArray(books) && books.some((b: any) => (b._id || b.id) === BOOK_ID);
  rec(F, 'GET /api/books (book in user list)', list.ok && present ? 'PASS' : 'FAIL',
    `count=${Array.isArray(books) ? books.length : '?'}`, list.status);
}

// ============================================================
async function flowDesign() {
  const F = 'Design';
  // Design state
  const state = await http('get', `/api/ai/design-state/${BOOK_ID}`);
  rec(F, 'GET /api/ai/design-state/:id', state.ok ? 'PASS' : 'FAIL', errText(state) || undefined, state.status);

  // Quick preview (Gemini)
  const prev = await http('post', `/api/ai/design-preview/${BOOK_ID}`, {}, { timeout: AI_TIMEOUT });
  rec(F, 'POST /api/ai/design-preview/:id (quick preview)', prev.ok ? 'PASS' : 'FAIL',
    prev.ok ? `keys=${Object.keys(prev.data?.data?.preview || {}).join(',') || 'none'}` : errText(prev), prev.status);

  // Cover colors (Gemini)
  const colors = await http('post', '/api/ai/generate-cover-colors', {
    title: `סיפור הבדיקה ${SUFFIX}`, genre: 'memoir', mood: 'נוסטלגי וחם', language: 'he',
  }, { timeout: AI_TIMEOUT });
  rec(F, 'POST /api/ai/generate-cover-colors', colors.ok ? 'PASS' : 'FAIL', errText(colors) || undefined, colors.status);

  // Full design (Gemini) — design-book
  const design = await http('post', `/api/ai/design-book/${BOOK_ID}`, {}, { timeout: AI_TIMEOUT });
  if (design.ok && design.data?.data?.design) {
    designFromAI = design.data.data.design;
    rec(F, 'POST /api/ai/design-book/:id (full design)', 'PASS',
      `sections=${Object.keys(designFromAI).join(',').slice(0, 80)}`, design.status);
  } else {
    rec(F, 'POST /api/ai/design-book/:id (full design)', 'FAIL', errText(design), design.status);
  }

  // Apply design (typography + layout) if we got one
  if (designFromAI) {
    const apply = await http('post', `/api/ai/apply-design/${BOOK_ID}`, {
      design: designFromAI, applyTypography: true, applyLayout: true, applyCover: false,
    }, { timeout: AI_TIMEOUT });
    rec(F, 'POST /api/ai/apply-design/:id', apply.ok ? 'PASS' : 'FAIL', errText(apply) || undefined, apply.status);
  } else {
    rec(F, 'POST /api/ai/apply-design/:id', 'SKIP', 'no design object from previous step');
  }
}

// ============================================================
async function flowAutoDesign() {
  const F = 'AutoDesign(עימוד)';
  // status before
  const before = await http('get', `/api/auto-design/${BOOK_ID}/status`);
  const usesBefore = before.data?.data?.usesRemaining;
  rec(F, 'GET /api/auto-design/:id/status (before)', before.ok ? 'PASS' : 'FAIL',
    before.ok ? `hasPlan=${before.data?.data?.hasPlan} usesRemaining=${usesBefore}` : errText(before), before.status);

  // generate (Claude planner + critic) — the typesetting feature
  const gen = await http('post', `/api/auto-design/${BOOK_ID}`, {}, { timeout: AI_TIMEOUT });
  if (gen.ok && gen.data?.data?.plan) {
    const d = gen.data.data;
    rec(F, 'POST /api/auto-design/:id (generate plan)', 'PASS',
      `system=${d.designSystem} pages=${d.plan?.pages?.length ?? '?'} passedFirstTry=${d.passedFirstTry} usesRemaining=${d.usesRemaining}`,
      gen.status);
  } else {
    rec(F, 'POST /api/auto-design/:id (generate plan)', 'FAIL', errText(gen), gen.status);
  }

  // status after — uses should decrement
  const after = await http('get', `/api/auto-design/${BOOK_ID}/status`);
  const usesAfter = after.data?.data?.usesRemaining;
  const decremented = typeof usesBefore === 'number' && typeof usesAfter === 'number' && usesAfter === usesBefore - 1;
  rec(F, 'GET status (after) — uses decremented & hasPlan', after.ok && after.data?.data?.hasPlan && decremented ? 'PASS' : (after.ok ? 'WARN' : 'FAIL'),
    `hasPlan=${after.data?.data?.hasPlan} usesRemaining=${usesAfter} (was ${usesBefore})`, after.status);

  // export.docx — only if a plan exists
  if (after.data?.data?.hasPlan) {
    const docx = await http('get', `/api/auto-design/${BOOK_ID}/export.docx`, undefined, { timeout: AI_TIMEOUT, responseType: 'arraybuffer' });
    const buf = docx.ok ? Buffer.from(docx.data) : null;
    const isZip = buf && buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b; // 'PK'
    rec(F, 'GET /api/auto-design/:id/export.docx', docx.ok && isZip ? 'PASS' : 'FAIL',
      docx.ok ? `bytes=${buf?.length} validDocx=${isZip}` : errText(docx), docx.status);
  } else {
    rec(F, 'GET /api/auto-design/:id/export.docx', 'SKIP', 'no plan to export');
  }
}

// ============================================================
async function flowExport() {
  const F = 'Export';
  // Sync PDF
  const pdf = await http('get', `/api/books/${BOOK_ID}/export`, undefined, { timeout: AI_TIMEOUT, responseType: 'arraybuffer' });
  if (pdf.ok) {
    const buf = Buffer.from(pdf.data);
    const isPdf = buf.length > 4 && buf.toString('ascii', 0, 4) === '%PDF';
    rec(F, 'GET /api/books/:id/export (sync PDF)', isPdf ? 'PASS' : 'FAIL', `bytes=${buf.length} validPdf=${isPdf}`, pdf.status);
  } else {
    // error body may be JSON inside arraybuffer
    let msg = '';
    try { msg = JSON.parse(Buffer.from(pdf.data).toString('utf8')).error; } catch { msg = errText(pdf); }
    rec(F, 'GET /api/books/:id/export (sync PDF)', 'FAIL', msg, pdf.status);
  }

  // Async PDF
  const enqueue = await http('post', `/api/books/${BOOK_ID}/export-async`, {});
  const jobId = enqueue.data?.data?.jobId || enqueue.data?.jobId;
  if (enqueue.ok && jobId) {
    rec(F, 'POST /api/books/:id/export-async (enqueue)', 'PASS', `jobId=${jobId}`, enqueue.status);
    // poll
    let final: any = null;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const job = await http('get', `/api/jobs/${jobId}`);
      const status = job.data?.data?.status;
      if (status === 'completed' || status === 'failed') { final = job.data?.data; break; }
    }
    if (!final) {
      rec(F, 'Async PDF job completes', 'FAIL', 'timed out after 120s');
    } else if (final.status === 'completed') {
      const url = final.result?.downloadUrl || final.downloadUrl;
      if (url) {
        const dl = await http('get', url.replace(BASE, ''), undefined, { auth: false, timeout: AI_TIMEOUT, responseType: 'arraybuffer' });
        // url is absolute (signed) — fetch directly
        let okDl = dl.ok;
        let bytes = 0;
        if (!okDl) {
          try {
            const direct = await axios.get(url, { responseType: 'arraybuffer', timeout: AI_TIMEOUT, validateStatus: () => true });
            okDl = direct.status >= 200 && direct.status < 300;
            bytes = direct.data?.byteLength || 0;
          } catch (e: any) { okDl = false; }
        } else { bytes = Buffer.from(dl.data).length; }
        rec(F, 'Async PDF job completes + downloadable', okDl ? 'PASS' : 'FAIL', `bytes=${bytes} url=${url.slice(0, 60)}...`);
      } else {
        rec(F, 'Async PDF job completes + downloadable', 'FAIL', 'completed but no downloadUrl');
      }
    } else {
      rec(F, 'Async PDF job completes', 'FAIL', `status=${final.status} err=${final.error || final.result?.error || ''}`);
    }
  } else {
    rec(F, 'POST /api/books/:id/export-async (enqueue)', 'FAIL', errText(enqueue), enqueue.status);
  }

  // DOCX by format
  const docx = await http('get', `/api/books/${BOOK_ID}/export/docx`, undefined, { timeout: AI_TIMEOUT, responseType: 'arraybuffer' });
  if (docx.ok) {
    const buf = Buffer.from(docx.data);
    const isZip = buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b;
    rec(F, 'GET /api/books/:id/export/docx', isZip ? 'PASS' : 'FAIL', `bytes=${buf.length} validDocx=${isZip}`, docx.status);
  } else {
    let msg = '';
    try { msg = JSON.parse(Buffer.from(docx.data).toString('utf8')).error; } catch { msg = errText(docx); }
    rec(F, 'GET /api/books/:id/export/docx', 'FAIL', msg, docx.status);
  }

  // PDF by format
  const pdf2 = await http('get', `/api/books/${BOOK_ID}/export/pdf`, undefined, { timeout: AI_TIMEOUT, responseType: 'arraybuffer' });
  if (pdf2.ok) {
    const buf = Buffer.from(pdf2.data);
    const isPdf = buf.length > 4 && buf.toString('ascii', 0, 4) === '%PDF';
    rec(F, 'GET /api/books/:id/export/pdf', isPdf ? 'PASS' : 'FAIL', `bytes=${buf.length} validPdf=${isPdf}`, pdf2.status);
  } else {
    let msg = '';
    try { msg = JSON.parse(Buffer.from(pdf2.data).toString('utf8')).error; } catch { msg = errText(pdf2); }
    rec(F, 'GET /api/books/:id/export/pdf', 'FAIL', msg, pdf2.status);
  }
}

// ============================================================
async function flowPublish() {
  const F = 'Publish';
  // Negative 1: missing synopsis (book currently has no synopsis/tags/cover)
  const n1 = await http('post', `/api/books/${BOOK_ID}/publish`, { isFree: true });
  const blockedSynopsis = n1.status === 400 && /synopsis/i.test(errText(n1));
  rec(F, 'Reject publish without synopsis', blockedSynopsis ? 'PASS' : 'WARN',
    `status=${n1.status} msg="${errText(n1)}"`, n1.status);

  // add synopsis (>=15 words)
  await http('put', `/api/books/${BOOK_ID}`, {
    synopsis: 'זהו תקציר בדיקה ארוך מספיק המכיל לפחות חמש עשרה מילים כדי לעבור את ולידציית הפרסום של המערכת בהצלחה גמורה.',
  });
  const n2 = await http('post', `/api/books/${BOOK_ID}/publish`, { isFree: true });
  const blockedTags = n2.status === 400 && /tag/i.test(errText(n2));
  rec(F, 'Reject publish without tags', blockedTags ? 'PASS' : 'WARN',
    `status=${n2.status} msg="${errText(n2)}"`, n2.status);

  // add tags
  await http('put', `/api/books/${BOOK_ID}`, { tags: ['זיכרון', 'משפחה', 'מורשת'] });
  const n3 = await http('post', `/api/books/${BOOK_ID}/publish`, { isFree: true });
  const blockedCover = n3.status === 400 && /cover/i.test(errText(n3));
  rec(F, 'Reject publish without cover', blockedCover ? 'PASS' : 'WARN',
    `status=${n3.status} msg="${errText(n3)}"`, n3.status);

  // add cover front imageUrl
  await http('put', `/api/books/${BOOK_ID}`, {
    coverDesign: {
      front: {
        imageUrl: 'https://picsum.photos/seed/e2ecover/600/900',
        title: `סיפור הבדיקה ${SUFFIX}`,
        author: 'E2E Flow Tester',
        backgroundColor: '#1a2b4a',
      },
    },
  });

  // Positive publish
  const pub = await http('post', `/api/books/${BOOK_ID}/publish`, { isFree: true });
  rec(F, 'POST /api/books/:id/publish (positive)', pub.ok ? 'PASS' : 'FAIL', errText(pub) || undefined, pub.status);

  // Paid-price validation (negative)
  const bad = await http('post', `/api/books/${BOOK_ID}/publish`, { isFree: false, price: 999 });
  rec(F, 'Reject invalid paid price (>$25)', bad.status === 400 ? 'PASS' : 'WARN',
    `status=${bad.status} msg="${errText(bad)}"`, bad.status);
}

// ============================================================
async function flowMarketplace() {
  const F = 'Marketplace';
  const list = await http('get', '/api/books/public?limit=50', undefined, { auth: false });
  const books = list.data?.data?.books || [];
  const present = books.some((b: any) => (b._id || b.id) === BOOK_ID);
  rec(F, 'GET /api/books/public (published book visible)', list.ok && present ? 'PASS' : 'FAIL',
    `count=${books.length} present=${present}`, list.status);

  const detail = await http('get', `/api/books/public/${BOOK_ID}`, undefined, { auth: false });
  const db = detail.data?.data?.book || detail.data?.data;
  rec(F, 'GET /api/books/public/:id (detail)', detail.ok && db ? 'PASS' : 'FAIL',
    detail.ok ? `chapters=${db?.chapters?.length ?? '?'}` : errText(detail), detail.status);

  const like = await http('post', `/api/books/${BOOK_ID}/like`, {});
  rec(F, 'POST /api/books/:id/like', like.ok ? 'PASS' : 'FAIL', errText(like) || undefined, like.status);

  const stats = await http('get', `/api/books/${BOOK_ID}/social-stats`);
  rec(F, 'GET /api/books/:id/social-stats', stats.ok ? 'PASS' : 'FAIL', errText(stats) || undefined, stats.status);
}

// ============================================================
async function cleanup() {
  if (KEEP) {
    console.log(`\n[cleanup] E2E_KEEP=1 — leaving book ${BOOK_ID} and user ${USER_ID} in place`);
    return;
  }
  try {
    if (BOOK_ID) {
      // Unpublish first so the real DELETE endpoint path is exercised
      await http('put', `/api/books/${BOOK_ID}`, {
        publishingStatus: { status: 'draft', isPublic: false, isFree: true, price: 0 },
      });
      const del = await http('delete', `/api/books/${BOOK_ID}`);
      rec('Cleanup', 'DELETE /api/books/:id (after unpublish)', del.ok ? 'PASS' : 'WARN', errText(del) || undefined, del.status);
      // hard-delete from DB in case API soft-deletes or leaves it public
      await supabaseAdmin.from('books').delete().eq('id', BOOK_ID);
    }
  } catch (e: any) {
    rec('Cleanup', 'delete book', 'WARN', e.message);
  }
  try {
    if (USER_ID) {
      await supabaseAdmin.from('books').delete().eq('author', USER_ID);
      await supabaseAdmin.from('users').delete().eq('id', USER_ID);
      rec('Cleanup', 'delete test user', 'PASS');
    }
  } catch (e: any) {
    rec('Cleanup', 'delete test user', 'WARN', e.message);
  }
}

// ============================================================
function summary() {
  const counts = { PASS: 0, FAIL: 0, WARN: 0, SKIP: 0 } as Record<Status, number>;
  for (const r of results) counts[r.status]++;
  console.log('\n================ E2E SUMMARY ================');
  console.log(`PASS ${counts.PASS}  FAIL ${counts.FAIL}  WARN ${counts.WARN}  SKIP ${counts.SKIP}  (total ${results.length})`);
  if (counts.FAIL || counts.WARN) {
    console.log('\n--- Issues (FAIL / WARN) ---');
    for (const r of results.filter((x) => x.status === 'FAIL' || x.status === 'WARN')) {
      console.log(`${r.status} [${r.flow}] ${r.name}${r.http ? ` (HTTP ${r.http})` : ''} — ${r.detail || ''}`);
    }
  }
  console.log('=============================================');
  // machine-readable artifact
  console.log('\nE2E_JSON_START');
  console.log(JSON.stringify(results));
  console.log('E2E_JSON_END');
}

async function main() {
  console.log(`E2E full-flow target: ${BASE}\n`);
  try {
    await setup();
    await flowWriting();
    await flowDesign();
    await flowAutoDesign();
    await flowExport();
    await flowPublish();
    await flowMarketplace();
  } catch (e: any) {
    console.error('\n[fatal]', e.message);
    rec('Run', 'fatal error', 'FAIL', e.message);
  } finally {
    await cleanup();
    summary();
  }
  process.exit(0);
}

main();
