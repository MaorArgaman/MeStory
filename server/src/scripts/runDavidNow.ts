/**
 * One-off runner: executes David's daily cycle immediately against the
 * configured Supabase + AI keys. Used to trigger/test a run locally.
 *
 *   npx ts-node --transpile-only src/scripts/runDavidNow.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { runDailyCycle } from '../services/david/davidAgent';

(async () => {
  console.log('▶️  Running David now (manual trigger)...\n');
  const start = Date.now();
  try {
    const result = await runDailyCycle('manual');
    console.log('\n✅ David finished');
    console.log('   status :', result.status);
    console.log('   summary:', result.summary);
    console.log('   runId  :', result.runId);
  } catch (err) {
    console.error('\n❌ David run threw:', err);
  } finally {
    console.log(`\n⏱  Took ${Math.round((Date.now() - start) / 1000)}s`);
    process.exit(0);
  }
})();
