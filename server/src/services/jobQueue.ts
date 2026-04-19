/**
 * Background job queue backed by the `jobs` Postgres table.
 *
 * Why this design (not BullMQ/Redis):
 *   - Vercel serverless has no long-running worker host.
 *   - Supabase is already in the stack.
 *   - JSONB input/output + RLS gives us audit + security for free.
 *
 * Execution model:
 *   1. Route handler calls `enqueueJob(...)` and immediately returns the job id.
 *   2. `runJobInBackground(...)` fires-and-forgets the actual work on the same
 *      Node process. On Vercel Pro this runs until maxDuration (60s default,
 *      up to 300s if configured). For longer work, trigger reprocessing via
 *      a Vercel cron that calls `processNextPendingJob()`.
 *   3. Client polls GET /api/jobs/:id for progress/result.
 */

import { supabaseAdmin } from '../config/supabase';

export type JobType =
  | 'pdf_export'
  | 'design_generation'
  | 'image_generation'
  | 'translation'
  | 'bulk_ai';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Job {
  id: string;
  user_id: string;
  book_id: string | null;
  type: JobType;
  status: JobStatus;
  progress: number;
  progress_message: string | null;
  input: any;
  result: any;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface EnqueueJobParams {
  id?: string;          // Pre-generated UUID; Supabase gen_random_uuid() used if omitted
  userId: string;
  bookId?: string | null;
  type: JobType;
  input: Record<string, any>;
}

/**
 * Inserts a new job row in state `pending` and returns it.
 * Does not start execution — call `runJobInBackground` or rely on a worker.
 */
export async function enqueueJob(params: EnqueueJobParams): Promise<Job> {
  const row: Record<string, any> = {
    user_id: params.userId,
    book_id: params.bookId ?? null,
    type: params.type,
    status: 'pending',
    progress: 0,
    input: params.input,
  };
  if (params.id) row.id = params.id;

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to enqueue job: ${error?.message || 'unknown error'}`);
  }
  return data as Job;
}

export async function getJob(jobId: string, userId?: string): Promise<Job | null> {
  let query = supabaseAdmin.from('jobs').select('*').eq('id', jobId);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query.single();
  if (error) return null;
  return data as Job;
}

export async function listUserJobs(userId: string, limit = 20): Promise<Job[]> {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  if (error) return [];
  return (data || []) as Job[];
}

export async function updateJobProgress(
  jobId: string,
  progress: number,
  message?: string
): Promise<void> {
  await supabaseAdmin
    .from('jobs')
    .update({
      progress: Math.max(0, Math.min(100, Math.round(progress))),
      progress_message: message ?? null,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

export async function completeJob(jobId: string, result: any): Promise<void> {
  await supabaseAdmin
    .from('jobs')
    .update({
      status: 'completed',
      progress: 100,
      result,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

export async function failJob(jobId: string, errorMessage: string): Promise<void> {
  await supabaseAdmin
    .from('jobs')
    .update({
      status: 'failed',
      error_message: errorMessage.slice(0, 1000),
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

/**
 * Fire-and-forget runner. The caller returns the job id to the client
 * immediately; this function runs the actual work asynchronously.
 *
 * Errors are caught and written to the job row — they never propagate to the
 * (already-sent) HTTP response.
 */
export function runJobInBackground(
  jobId: string,
  work: (
    helpers: {
      updateProgress: (p: number, msg?: string) => Promise<void>;
    }
  ) => Promise<any>
): void {
  // Intentionally not awaited — detaches from the request lifecycle.
  (async () => {
    try {
      await updateJobProgress(jobId, 1, 'Starting...');
      const result = await work({
        updateProgress: (p: number, msg?: string) => updateJobProgress(jobId, p, msg),
      });
      await completeJob(jobId, result ?? {});
    } catch (err: any) {
      console.error(`[jobQueue] Job ${jobId} failed:`, err);
      await failJob(jobId, err?.message || String(err));
    }
  })();
}
