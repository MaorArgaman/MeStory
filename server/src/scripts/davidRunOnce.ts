/* One-off: run David's full daily cycle locally (no serverless time limit) to
 * measure timing and prove the article step completes. Publishes for real. */
import 'dotenv/config';
import { runDailyCycle } from '../services/david/davidAgent';

async function main() {
  const t0 = Date.now();
  console.log('Starting David cycle (manual)…\n');
  const result = await runDailyCycle('manual');
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n=== DONE in ${secs}s ===`);
  console.log(JSON.stringify(result, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error('CYCLE THREW:', e); process.exit(1); });
