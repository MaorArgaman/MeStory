import dotenv from 'dotenv'; dotenv.config();
import { supabaseAdmin } from '../config/supabase';
import { Book } from '../models/Book';
import { User } from '../models/User';
import { UserActivity } from '../models/UserActivity';
import { randomUUID } from 'crypto';

(async () => {
  const TS = Date.now();
  const GENRE = `e2e_qtest_${TS}`;          // unique marker to scope our books
  const CAT = `e2e_cat_${TS}`;              // unique category value
  let pass = true;
  const check = (label: string, cond: boolean, got: any) => {
    console.log(`${cond ? 'PASS' : 'FAIL'} ${label} — got ${JSON.stringify(got)}`); if (!cond) pass = false;
  };
  const userId = randomUUID();
  const created: string[] = [];
  const users: string[] = [userId];

  try {
    await supabaseAdmin.from('users').insert({
      id: userId, name: 'Q Test', email: `e2e.qfix.${TS}@mestory.test`,
      password: 'x', role: 'FREE', credits: 0, email_verification: { isVerified: false },
    });

    // ---- Q1: marketplace category filter ----
    const bWithCat = await Book.create({
      title: 'with-cat', author: userId, genre: GENRE,
      publishingStatus: { status: 'published', isPublic: true, isFree: true, price: 0, marketingStrategy: { categories: [CAT, 'other'] } } as any,
      qualityScore: { overallScore: 30 } as any,
    } as any);
    created.push(bWithCat.id);
    const bNoCat = await Book.create({
      title: 'no-cat', author: userId, genre: GENRE,
      publishingStatus: { status: 'published', isPublic: true, isFree: true, price: 0, marketingStrategy: { categories: ['other'] } } as any,
      qualityScore: { overallScore: 80 } as any,
    } as any);
    created.push(bNoCat.id);

    const catHits = await Book.find({ 'publishingStatus.status': 'published', 'publishingStatus.marketingStrategy.categories': CAT });
    check('Q1 category filter returns only the matching book',
      catHits.length === 1 && catHits[0].id === bWithCat.id, { n: catHits.length });

    // ---- Q2: User createdAt $gte ----
    const yesterday = new Date(TS - 24 * 3600e3);
    const tomorrow = new Date(TS + 24 * 3600e3);
    const cntSince = await User.countDocuments({ createdAt: { $gte: yesterday } });
    const cntFuture = await User.countDocuments({ createdAt: { $gte: tomorrow } });
    check('Q2 countDocuments($gte yesterday) includes new user', cntSince >= 1, cntSince);
    check('Q2 countDocuments($gte tomorrow) excludes it (= 0)', cntFuture === 0, cntFuture);
    const findSince = await User.find({ createdAt: { $gte: yesterday } });
    check('Q2 find($gte yesterday) returns our user', findSince.some(u => u.id === userId), findSince.length);

    // ---- Q3: flagged-books predicate (0 < score < 60) ----
    const ourPublished = await Book.find({ 'publishingStatus.status': 'published', genre: GENRE });
    const flagged = ourPublished.filter((b: any) => { const s = b.qualityScore?.overallScore || 0; return s > 0 && s < 60; });
    check('Q3 flagged filter: only the score=30 book (not 80)',
      flagged.length === 1 && flagged[0].id === bWithCat.id, flagged.map((b: any) => b.qualityScore?.overallScore));

    // ---- Q4: UserActivity $in ----
    const u2 = randomUUID(); users.push(u2);
    await supabaseAdmin.from('users').insert({ id: u2, name: 'Q2', email: `e2e.qfix2.${TS}@mestory.test`, password: 'x', role: 'FREE', credits: 0, email_verification: { isVerified: false } });
    await UserActivity.create({ userId } as any);
    await UserActivity.create({ userId: u2 } as any);
    const inHits = await UserActivity.find({ userId: { $in: [userId, u2] } } as any);
    check('Q4 UserActivity.find($in [a,b]) returns both', inHits.length === 2, inHits.length);

    // ---- Q5: pagination (findAll + _offset) ----
    const all = await Book.findAll({ genre: GENRE });
    check('Q5 findAll returns all our books', all.length === 2, all.length);
    const page0 = await Book.find({ genre: GENRE, _limit: 1, _offset: 0 });
    const page1 = await Book.find({ genre: GENRE, _limit: 1, _offset: 1 });
    check('Q5 _offset paginates (distinct rows per page)',
      page0.length === 1 && page1.length === 1 && page0[0].id !== page1[0].id, { p0: page0[0]?.id, p1: page1[0]?.id });
  } finally {
    for (const id of created) await supabaseAdmin.from('books').delete().eq('id', id);
    for (const id of users) { await supabaseAdmin.from('user_activities').delete().eq('user_id', id); await supabaseAdmin.from('users').delete().eq('id', id); }
  }

  console.log(pass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  process.exit(pass ? 0 : 1);
})();
