import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { runValidation } from '../middleware/validate';
import { uuidValidation } from '../middleware/validators';
import { getJobStatus, listJobs } from '../controllers/jobsController';

const router = Router();

router.use(authenticate as any);

// GET /api/jobs - list user jobs (for a "my work in progress" drawer)
router.get('/', listJobs as any);

// GET /api/jobs/:id - poll single job status
router.get('/:id', runValidation(uuidValidation), getJobStatus as any);

export default router;
