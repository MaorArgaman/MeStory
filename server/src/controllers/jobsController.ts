import { Response } from 'express';
import { AuthRequest } from '../types';
import { getJob, listUserJobs } from '../services/jobQueue';

/**
 * GET /api/jobs/:id
 * Returns job status + progress + result for polling UIs.
 */
export const getJobStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const job = await getJob(req.params.id, userId);
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        progressMessage: job.progress_message,
        result: job.status === 'completed' ? job.result : null,
        error: job.error_message,
        createdAt: job.created_at,
        completedAt: job.completed_at,
      },
    });
  } catch (err) {
    console.error('getJobStatus error:', err);
    res.status(500).json({ success: false, error: 'Failed to get job status' });
  }
};

/**
 * GET /api/jobs
 * Lists recent jobs for the authenticated user.
 */
export const listJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    const limit = Math.min(parseInt((req.query.limit as string) || '20'), 100);
    const jobs = await listUserJobs(userId, limit);
    res.status(200).json({ success: true, data: { jobs } });
  } catch (err) {
    console.error('listJobs error:', err);
    res.status(500).json({ success: false, error: 'Failed to list jobs' });
  }
};
