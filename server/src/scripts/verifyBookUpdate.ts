import dotenv from 'dotenv'; dotenv.config();
import { supabaseAdmin } from '../config/supabase';
import { Book } from '../models/Book';
import { randomUUID } from 'crypto';

(async () => {
  // temp user (author FK)
  const userId = randomUUID();
  await supabaseAdmin.from('users').insert({
    id: userId, name: 'BU Test', email: `e2e.bookupd.${Date.now()}@mestory.test`,
    password: 'x', role: 'FREE', credits: 0, email_verification: { isVerified: false },
  });

  const book = await Book.create({
    title: 'Book Update Test', author: userId, genre: 'memoir',
    statistics: { wordCount: 10, views: 0, purchases: 1, revenue: 5, completionRate: 0 } as any,
    publishingStatus: { status: 'published', isPublic: true, isFree: true, price: 0 } as any,
    tags: ['a'],
  } as any);
  const id = book.id;
  await supabaseAdmin.from('books').update({ auto_design_uses: 0 }).eq('id', id);

  let pass = true;
  const read = async () => (await supabaseAdmin.from('books')
    .select('statistics,publishing_status,auto_design_uses,auto_design_plan,tags').eq('id', id).single()).data as any;
  const check = (label: string, cond: boolean, got: any) => {
    console.log(`${cond ? 'PASS' : 'FAIL'} ${label} — got ${JSON.stringify(got)}`); if (!cond) pass = false;
  };

  // 1) direct dotted update into JSONB
  await Book.findByIdAndUpdate(id, { 'statistics.completionRate': 50 } as any, { new: false });
  let r = await read();
  check('direct dotted statistics.completionRate=50', r.statistics?.completionRate === 50, r.statistics?.completionRate);
  check('  ...preserves sibling statistics.purchases=1', r.statistics?.purchases === 1, r.statistics?.purchases);

  // 2) $set with dotted keys
  await Book.findByIdAndUpdate(id, { $set: { 'statistics.purchases': 3, 'statistics.revenue': 9 } } as any, { new: false });
  r = await read();
  check('$set dotted statistics.purchases=3 & revenue=9', r.statistics?.purchases === 3 && r.statistics?.revenue === 9, { p: r.statistics?.purchases, rev: r.statistics?.revenue });
  check('  ...still preserves completionRate=50', r.statistics?.completionRate === 50, r.statistics?.completionRate);

  // 3) $set + $inc TOGETHER (the auto-design cap bug)
  await Book.findByIdAndUpdate(id, { $set: { autoDesignPlan: { designSystem: 'editorial-modern' } }, $inc: { autoDesignUses: 1 } } as any, { new: false });
  r = await read();
  check('$set+$inc together: auto_design_uses incremented to 1', r.auto_design_uses === 1, r.auto_design_uses);
  check('  ...and autoDesignPlan persisted', r.auto_design_plan?.designSystem === 'editorial-modern', r.auto_design_plan);

  // 4) direct dotted publishingStatus (admin unpublish)
  await Book.findByIdAndUpdate(id, { 'publishingStatus.status': 'draft', 'publishingStatus.isPublic': false } as any, { new: false });
  r = await read();
  check('admin unpublish: publishing_status.status=draft & isPublic=false', r.publishing_status?.status === 'draft' && r.publishing_status?.isPublic === false, r.publishing_status);

  // 5) $push still works
  await Book.findByIdAndUpdate(id, { $push: { tags: 'b' } } as any, { new: false });
  r = await read();
  check('$push tags -> [a,b]', Array.isArray(r.tags) && r.tags.includes('a') && r.tags.includes('b'), r.tags);

  // 6) nested $inc still works
  await Book.findByIdAndUpdate(id, { $inc: { 'statistics.views': 2 } } as any, { new: false });
  r = await read();
  check('$inc statistics.views=2', r.statistics?.views === 2, r.statistics?.views);

  await supabaseAdmin.from('books').delete().eq('id', id);
  await supabaseAdmin.from('users').delete().eq('id', userId);
  console.log(pass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  process.exit(pass ? 0 : 1);
})();
