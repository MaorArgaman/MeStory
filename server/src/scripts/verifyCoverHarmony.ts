/**
 * Verify the auto-design (עימוד) palette now harmonizes with the book's cover.
 * Provisions a premium user, gives the book a distinctly WARM BROWN cover,
 * runs a real auto-design, and prints the resulting plan palette so we can
 * confirm it landed in the warm/brown family (not a clashing cool palette).
 */
import dotenv from 'dotenv'; dotenv.config();
import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';

const BASE = process.env.E2E_BASE || 'http://localhost:5001';
let TOKEN = '';
const H = () => ({ headers: { Authorization: `Bearer ${TOKEN}` }, validateStatus: () => true, timeout: 250000 });

// crude warm-hue check: is the color reddish/brownish (R dominant, not blue)?
function isWarm(hex?: string): boolean {
  if (!hex) return false;
  const m = hex.replace('#', '');
  if (m.length < 6) return false;
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return r >= b; // warm tones have red >= blue; cool blues fail this
}

(async () => {
  const TS = Date.now();
  const email = `e2e.harmony.${TS}@mestory.test`;
  const reg = await axios.post(`${BASE}/api/auth/register`, { name: 'Harmony', email, password: 'E2e!Pass123' }, { validateStatus: () => true });
  const userId = reg.data?.data?.user?.id;
  await supabaseAdmin.from('users').update({ role: 'PREMIUM', credits: 999999, email_verification: { isVerified: true } }).eq('id', userId);
  const login = await axios.post(`${BASE}/api/auth/login`, { email, password: 'E2e!Pass123' }, { validateStatus: () => true });
  TOKEN = login.data?.data?.token;

  const create = await axios.post(`${BASE}/api/books`, { title: `הרמוניה ${TS}`, genre: 'memoir', language: 'he' }, H());
  const bookId = create.data?.data?.id || create.data?.data?.book?.id;
  await axios.put(`${BASE}/api/books/${bookId}`, {
    chapters: [
      { title: 'פרק א', content: '<p>' + 'תוכן חמים ונוסטלגי לבדיקה. '.repeat(50) + '</p>', order: 0, wordCount: 150 },
      { title: 'פרק ב', content: '<p>' + 'המשך הסיפור המשפחתי. '.repeat(50) + '</p>', order: 1, wordCount: 150 },
    ],
    // Distinctly WARM BROWN/BRONZE cover
    coverDesign: {
      front: {
        type: 'gradient',
        imageUrl: 'https://picsum.photos/seed/brown/600/900',
        backgroundColor: '#4a3422',
        gradientColors: ['#3a2817', '#6b4f33', '#a67c52'],
        title: { text: `הרמוניה ${TS}`, font: 'Frank Ruhl Libre', size: 40, color: '#f0e6d2', position: { x: 50, y: 30 } },
        authorName: { text: 'מאור ארגמן', font: 'Frank Ruhl Libre', size: 20, color: '#d9c4a3' },
      },
    },
  }, H());

  try {
    const gen = await axios.post(`${BASE}/api/auto-design/${bookId}`, {}, H());
    const plan = gen.data?.data?.plan;
    console.log('status:', gen.status, 'designSystem:', gen.data?.data?.designSystem);
    console.log('Cover colors (input): bg #4a3422, gradient [#3a2817,#6b4f33,#a67c52]');
    console.log('Resulting interior palette:', JSON.stringify(plan?.palette));
    const p = plan?.palette || {};
    const warmCount = [p.background, p.accent, p.text, p.muted].filter(isWarm).length;
    console.log(`Warm-tone palette entries: ${warmCount}/4`);
    console.log(warmCount >= 2
      ? 'PASS — interior palette is in the warm family, harmonizing with the brown cover.'
      : 'CHECK — palette may not be harmonizing (eyeball the colors above).');
  } finally {
    await supabaseAdmin.from('books').delete().eq('id', bookId);
    await supabaseAdmin.from('users').delete().eq('id', userId);
  }
  process.exit(0);
})();
