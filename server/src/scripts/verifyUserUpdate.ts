import dotenv from 'dotenv'; dotenv.config();
import { supabaseAdmin } from '../config/supabase';
import { User } from '../models/User';
import { randomUUID } from 'crypto';

(async () => {
  const id = randomUUID();
  const email = `e2e.modeltest.${Date.now()}@mestory.test`;
  const { error: insErr } = await supabaseAdmin.from('users').insert({
    id, name: 'Model Test', email, password: 'x', role: 'FREE', credits: 10,
    profile: { bio: 'KEEP_ME', writingStatistics: { totalWords: 99, booksWritten: 7 } },
    email_verification: { isVerified: false },
  });
  if (insErr) { console.log('SEED FAIL', insErr.message); process.exit(1); }

  let pass = true;
  const check = (label: string, cond: boolean, got: any) => {
    console.log(`${cond ? 'PASS' : 'FAIL'} ${label} — got ${JSON.stringify(got)}`);
    if (!cond) pass = false;
  };

  await User.findByIdAndUpdate(id, { 'profile.authorProfile.publishedBooks': 5 });
  await User.findByIdAndUpdate(id, { 'profile.readingHistory': [{ bookId: 'b1' }] });
  await User.findByIdAndUpdate(id, { 'profile.writingStatistics.totalWords': 250 });

  const { data } = await supabaseAdmin.from('users').select('profile').eq('id', id).single();
  const p: any = data?.profile || {};
  check('authorProfile.publishedBooks persisted (=5)', p.authorProfile?.publishedBooks === 5, p.authorProfile);
  check('readingHistory persisted', Array.isArray(p.readingHistory) && p.readingHistory[0]?.bookId === 'b1', p.readingHistory);
  check('writingStatistics.totalWords updated (=250)', p.writingStatistics?.totalWords === 250, p.writingStatistics);
  check('sibling booksWritten preserved (=7)', p.writingStatistics?.booksWritten === 7, p.writingStatistics);
  check('unrelated field bio preserved (KEEP_ME)', p.bio === 'KEEP_ME', p.bio);

  await supabaseAdmin.from('users').delete().eq('id', id);
  console.log(pass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  process.exit(pass ? 0 : 1);
})();
