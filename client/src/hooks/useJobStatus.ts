import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface JobStatus {
  id: string;
  type: 'pdf_export' | 'design_generation' | 'image_generation' | 'translation' | 'bulk_ai';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  progressMessage: string | null;
  result: any;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Polls a background job's status until it finishes.
 * Use this after enqueueing an async operation (PDF export, design generation, …).
 *
 * Polling stops automatically once the job reaches `completed`/`failed`/`cancelled`.
 */
export function useJobStatus(jobId: string | null | undefined, pollIntervalMs = 2000) {
  return useQuery<JobStatus>({
    queryKey: ['job', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const res = await api.get(`/jobs/${jobId}`);
      return res.data.data as JobStatus;
    },
    // Stop polling once the job is done
    refetchInterval: (query) => {
      const data = query.state.data as JobStatus | undefined;
      if (!data) return pollIntervalMs;
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
        return false;
      }
      return pollIntervalMs;
    },
    staleTime: 0, // always fresh while polling
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Convenience booleans derived from job state.
 */
export function isJobDone(status?: JobStatus['status']): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled';
}
