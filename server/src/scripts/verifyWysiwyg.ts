import dotenv from 'dotenv'; dotenv.config();
import { supabaseAdmin } from '../config/supabase';
import { Book } from '../models/Book';
import { resolveActiveDesign } from '../utils/activeDesign';
import { renderDesignedBookDocx } from '../services/autoDesign/renderDocx';
import { randomUUID } from 'crypto';

const PLAN: any = {
  version: 1, seed: 1, designSystem: 'editorial-modern', tone: 'warm',
  palette: { text: '#222222', background: '#ffffff', accent: '#884400', muted: '#888888' },
  typography: { bodyFamily: 'Noto Serif', headingFamily: 'Noto Sans', baseSize: 11, leading: 1.5, scale: [9, 11, 14, 18, 24] },
  grid: { columns: 1, marginsMm: { top: 18, bottom: 18, start: 16, end: 16 }, gutterMm: 4 },
  pages: [{ kind: 'body', blocks: [
    { type: 'heading', level: 1, text: 'פרק ראשון', align: 'start' },
    { type: 'paragraph', text: 'תוכן הפרק כאן לבדיקה.', align: 'start' },
  ] }],
};

(async () => {
  let pass = true;
  const check = (label: string, cond: boolean, got: any) => {
    console.log(`${cond ? 'PASS' : 'FAIL'} ${label} — got ${JSON.stringify(got)}`); if (!cond) pass = false;
  };
  const userId = randomUUID();
  await supabaseAdmin.from('users').insert({ id: userId, name: 'W', email: `e2e.wys.${Date.now()}@mestory.test`, password: 'x', role: 'FREE', credits: 0, email_verification: { isVerified: false } });
  const book = await Book.create({ title: 'WYSIWYG Test', author: userId, genre: 'memoir' } as any);
  const id = book.id;
  const read = async () => (await supabaseAdmin.from('books').select('ai_design_state,auto_design_plan,page_layout,cover_design').eq('id', id).single()).data as any;

  try {
    // 1) Saving manual layout/cover stamps activeDesign=manual
    await Book.findByIdAndUpdate(id, { coverDesign: { front: { imageUrl: 'https://picsum.photos/seed/wyscover/300/400', title: 'WYSIWYG Test' } }, 'aiDesignState.activeDesign': 'manual' } as any, { new: false });
    let r = await read();
    check('flag=manual after cover save', r.ai_design_state?.activeDesign === 'manual', r.ai_design_state);
    check('resolveActiveDesign -> manual', resolveActiveDesign(await Book.findById(id)) === 'manual', null);

    // 2) Running auto-design ($set dotted) stamps activeDesign=auto and keeps plan
    await Book.findByIdAndUpdate(id, { $set: { autoDesignPlan: PLAN, 'aiDesignState.activeDesign': 'auto' }, $inc: { autoDesignUses: 1 } } as any, { new: false });
    r = await read();
    check('flag=auto after auto-design', r.ai_design_state?.activeDesign === 'auto', r.ai_design_state);
    check('autoDesignPlan persisted alongside flag', !!r.auto_design_plan?.pages, !!r.auto_design_plan);
    check('resolveActiveDesign -> auto', resolveActiveDesign(await Book.findById(id)) === 'auto', null);

    // 3) Auto-design DOCX now includes the cover image (bytes grow vs no-cover)
    const fullBook = await Book.findByIdForDesign(id);
    const withCover = await renderDesignedBookDocx(fullBook as any, PLAN);
    const noCoverBook = { ...(fullBook as any), coverDesign: undefined };
    const withoutCover = await renderDesignedBookDocx(noCoverBook as any, PLAN);
    const isDocx = withCover.length > 4 && withCover[0] === 0x50 && withCover[1] === 0x4b;
    check('auto-design DOCX is a valid docx', isDocx, { bytes: withCover.length });
    check('cover embeds image (with-cover bytes >> without-cover)', withCover.length > withoutCover.length + 5000,
      { withCover: withCover.length, withoutCover: withoutCover.length });
  } finally {
    await supabaseAdmin.from('books').delete().eq('id', id);
    await supabaseAdmin.from('users').delete().eq('id', userId);
  }

  console.log(pass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
  process.exit(pass ? 0 : 1);
})();
