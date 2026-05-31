/**
 * Live end-to-end check of the auto-design (עימוד) feature against a running
 * server, reading the DB directly to confirm persistence. Provisions a premium
 * user, runs a real generate (Claude planner+critic), and verifies:
 *   - plan + uses persisted to DB
 *   - status endpoint reflects hasPlan + usesRemaining
 *   - export.docx works
 *   - the 3-uses cap is enforced
 */
import dotenv from 'dotenv'; dotenv.config();
import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';
import { randomUUID } from 'crypto';

const BASE = process.env.E2E_BASE || 'http://localhost:5001';
let TOKEN = '';
let pass = true;
const check = (label: string, cond: boolean, got: any) => {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${label} — ${JSON.stringify(got)}`); if (!cond) pass = false;
};
const H = (rt: any = 'json') => ({ headers: { Authorization: `Bearer ${TOKEN}` }, validateStatus: () => true, timeout: 250000, responseType: rt as any });

(async () => {
  const TS = Date.now();
  const email = `e2e.adlive.${TS}@mestory.test`;
  const reg = await axios.post(`${BASE}/api/auth/register`, { name: 'AD Live', email, password: 'E2e!Pass123' }, { validateStatus: () => true });
  const userId = reg.data?.data?.user?.id;
  await supabaseAdmin.from('users').update({ role: 'PREMIUM', credits: 999999, email_verification: { isVerified: true } }).eq('id', userId);
  const login = await axios.post(`${BASE}/api/auth/login`, { email, password: 'E2e!Pass123' }, { validateStatus: () => true });
  TOKEN = login.data?.data?.token;

  const create = await axios.post(`${BASE}/api/books`, { title: `עימוד לייב ${TS}`, genre: 'memoir', language: 'he' }, H());
  const bookId = create.data?.data?.id || create.data?.data?.book?.id;
  await axios.put(`${BASE}/api/books/${bookId}`, { chapters: [
    { title: 'פרק א', content: '<p>' + 'תוכן לבדיקה. '.repeat(60) + '</p>', order: 0, wordCount: 180 },
    { title: 'פרק ב', content: '<p>' + 'עוד תוכן לבדיקה. '.repeat(60) + '</p>', order: 1, wordCount: 180 },
  ] }, H());

  try {
    // 1) generate
    const gen = await axios.post(`${BASE}/api/auto-design/${bookId}`, {}, H());
    check('POST auto-design -> 200 with plan', gen.status === 200 && !!gen.data?.data?.plan,
      { status: gen.status, system: gen.data?.data?.designSystem, pages: gen.data?.data?.plan?.pages?.length });

    // 2) DB persisted
    const { data: row } = await supabaseAdmin.from('books').select('auto_design_plan,auto_design_uses').eq('id', bookId).single();
    check('DB: auto_design_uses === 1', (row as any)?.auto_design_uses === 1, (row as any)?.auto_design_uses);
    check('DB: auto_design_plan persisted', !!(row as any)?.auto_design_plan?.pages, !!(row as any)?.auto_design_plan);

    // 3) status reflects it
    const st = await axios.get(`${BASE}/api/auto-design/${bookId}/status`, H());
    check('status: hasPlan=true & usesRemaining=2', st.data?.data?.hasPlan === true && st.data?.data?.usesRemaining === 2, st.data?.data);

    // 4) export.docx works (no longer 404)
    const docx = await axios.get(`${BASE}/api/auto-design/${bookId}/export.docx`, H('arraybuffer'));
    const buf = docx.status === 200 ? Buffer.from(docx.data) : null;
    check('export.docx -> valid docx', !!buf && buf[0] === 0x50 && buf[1] === 0x4b, { status: docx.status, bytes: buf?.length });

    // 5) cap enforced — force uses to 3 then expect 429
    await supabaseAdmin.from('books').update({ auto_design_uses: 3 }).eq('id', bookId);
    const capped = await axios.post(`${BASE}/api/auto-design/${bookId}`, {}, H());
    check('cap enforced: 4th generate -> 429 CAP_REACHED', capped.status === 429 && capped.data?.errorCode === 'AUTO_DESIGN_CAP_REACHED',
      { status: capped.status, code: capped.data?.errorCode });
  } finally {
    await supabaseAdmin.from('books').delete().eq('id', bookId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
  }

  console.log(pass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  process.exit(pass ? 0 : 1);
})();
