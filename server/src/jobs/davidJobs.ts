/**
 * David's daily cron — local/dev only. On Vercel (serverless) node-cron does
 * not run; production is driven by Vercel Cron hitting
 * GET /api/agents/david/run (see root vercel.json + CRON_SECRET).
 *
 * Runs at 06:00 Asia/Jerusalem so the report is waiting in the morning.
 */

import * as cron from 'node-cron';
import { runDailyCycle } from '../services/david/davidAgent';
import { hasRunToday } from '../services/david/davidStore';

let isInitialized = false;
let job: any = null;

export function initializeDavidJobs(): void {
  if (isInitialized) return;

  job = cron.schedule(
    '0 6 * * *',
    async () => {
      console.log('[DavidJobs] Running daily SEO/GEO/AEO cycle...');
      try {
        if (await hasRunToday()) {
          console.log('[DavidJobs] Already ran today, skipping.');
          return;
        }
        const result = await runDailyCycle('cron');
        console.log(`[DavidJobs] Done: ${result.status} — ${result.summary}`);
      } catch (error) {
        console.error('[DavidJobs] Daily cycle failed:', error);
      }
    },
    { timezone: 'Asia/Jerusalem' },
  );

  isInitialized = true;
  console.log('[DavidJobs] David daily job scheduled (06:00 Asia/Jerusalem)');
}

export function stopDavidJobs(): void {
  if (job) job.stop();
  isInitialized = false;
}
