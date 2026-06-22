/* One-off: when did David last create an article / run? */
import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase';
import { failStaleRuns } from '../services/david/davidStore';

async function main() {
  // `npx tsx src/scripts/davidLastArticle.ts --fix` also marks stuck "running"
  // rows as failed, so the admin log stops lying about runs that were killed.
  if (process.argv.includes('--fix')) {
    const swept = await failStaleRuns(15);
    console.log(`>>> Swept ${swept} stale "running" run(s) → error\n`);
  }

  const { data: articles, error: aErr } = await supabaseAdmin
    .from('david_articles')
    .select('slug, title, status, created_at, published_at, target_query')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('=== ARTICLES (latest 10) ===');
  if (aErr) console.log('articles error:', aErr.message);
  else if (!articles?.length) console.log('(none — David has never created an article)');
  else for (const a of articles) {
    console.log(`${a.created_at}  [${a.status}]  ${a.title}  (/guides/${a.slug})`);
  }

  const { data: runs, error: rErr } = await supabaseAdmin
    .from('david_runs')
    .select('run_date, status, trigger, started_at, finished_at, actions_count, summary, error')
    .order('run_date', { ascending: false })
    .order('started_at', { ascending: false })
    .limit(10);

  console.log('\n=== RUNS (latest 10) ===');
  if (rErr) console.log('runs error:', rErr.message);
  else if (!runs?.length) console.log('(none — David has never run)');
  else for (const r of runs) {
    console.log(`${r.run_date}  [${r.status}/${r.trigger}]  actions=${r.actions_count ?? '?'}  finished=${r.finished_at ? 'yes' : 'NO'}  ${r.error ? 'ERR:' + r.error : (r.summary || '')}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
