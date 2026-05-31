/**
 * Reproduces the modal contradiction bug ("design ready" panel vs "no
 * auto-design plan" preview). The preview page (/print/:id/designed) fetches
 * GET /api/books/:id; if that response omits autoDesignPlan, the preview (and
 * the designed PDF) wrongly show "no plan". We inject a plan directly (no
 * Claude cost) and confirm every read path the modal/preview relies on sees it.
 */
import dotenv from 'dotenv'; dotenv.config();
import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';

const BASE = process.env.E2E_BASE || 'http://localhost:5001';
let TOKEN = '';
const H = () => ({ headers: { Authorization: `Bearer ${TOKEN}` }, validateStatus: () => true, timeout: 30000 });
let pass = true;
const check = (l: string, c: boolean, g: any) => { console.log(`${c ? 'PASS' : 'FAIL'} ${l} — ${JSON.stringify(g)}`); if (!c) pass = false; };

(async () => {
  const TS = Date.now();
  const email = `e2e.preview.${TS}@mestory.test`;
  const reg = await axios.post(`${BASE}/api/auth/register`, { name: 'Prev', email, password: 'E2e!Pass123' }, { validateStatus: () => true });
  const userId = reg.data?.data?.user?.id;
  await supabaseAdmin.from('users').update({ role: 'PREMIUM', credits: 999999, email_verification: { isVerified: true } }).eq('id', userId);
  const login = await axios.post(`${BASE}/api/auth/login`, { email, password: 'E2e!Pass123' }, { validateStatus: () => true });
  TOKEN = login.data?.data?.token;
  const create = await axios.post(`${BASE}/api/books`, { title: `תצוגה ${TS}`, genre: 'memoir', language: 'he' }, H());
  const bookId = create.data?.data?.id || create.data?.data?.book?.id;

  // Inject a plan + uses directly (simulate a completed auto-design) — no Claude call.
  const fakePlan = { version: 1, designSystem: 'memoir-warm', pages: [{ kind: 'title', blocks: [] }], palette: { text: '#000', background: '#fff', accent: '#a67c52', muted: '#ccc' }, typography: { bodyFamily: 'Noto Serif', headingFamily: 'Noto Sans', baseSize: 11, leading: 1.5, scale: [9, 11, 14, 18, 24] }, grid: { columns: 1, marginsMm: { top: 18, bottom: 18, start: 16, end: 16 }, gutterMm: 4 } };
  await supabaseAdmin.from('books').update({ auto_design_plan: fakePlan, auto_design_uses: 1 }).eq('id', bookId);

  try {
    // 1) The status endpoint the modal panel uses
    const st = await axios.get(`${BASE}/api/auto-design/${bookId}/status`, H());
    check('status: hasPlan=true, usesRemaining=2', st.data?.data?.hasPlan === true && st.data?.data?.usesRemaining === 2, st.data?.data);

    // 2) The exact endpoint the /print/:id/designed PREVIEW fetches
    const gb = await axios.get(`${BASE}/api/books/${bookId}`, H());
    const bookData = gb.data?.data?.book || gb.data?.data;
    check('GET /books/:id returns autoDesignPlan (preview/PDF source)', !!bookData?.autoDesignPlan?.pages, !!bookData?.autoDesignPlan);
  } finally {
    await supabaseAdmin.from('books').delete().eq('id', bookId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
  }
  console.log(pass ? '\nALL CHECKS PASSED — preview/PDF will see the plan; modal contradiction resolved.' : '\nSOME CHECKS FAILED — getBookById still omits the plan.');
  process.exit(pass ? 0 : 1);
})();
