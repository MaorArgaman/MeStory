/* One-off: inspect today's run timing + actions to tell in-progress vs stuck. */
import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase';

async function main() {
  const nowMs = Date.now();
  console.log('Now (UTC):', new Date(nowMs).toISOString(), '\n');

  const { data: runs } = await supabaseAdmin
    .from('david_runs')
    .select('id, run_date, status, trigger, started_at, finished_at, actions_count, error')
    .order('started_at', { ascending: false })
    .limit(3);

  for (const r of runs || []) {
    const ageMin = (nowMs - new Date(r.started_at).getTime()) / 60000;
    console.log(`run ${r.run_date} [${r.status}/${r.trigger}]`);
    console.log(`  started_at: ${r.started_at}  (${ageMin.toFixed(1)} min ago)`);
    console.log(`  finished_at: ${r.finished_at || 'NULL'}  actions_count=${r.actions_count}`);
    if (r.error) console.log(`  error: ${r.error}`);

    const { data: actions } = await supabaseAdmin
      .from('david_actions')
      .select('type, title, created_at')
      .eq('run_id', r.id)
      .order('created_at', { ascending: true });
    if (actions?.length) {
      for (const a of actions) console.log(`    - [${a.type}] ${a.title}`);
    } else {
      console.log('    (no actions logged)');
    }
    console.log('');
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
