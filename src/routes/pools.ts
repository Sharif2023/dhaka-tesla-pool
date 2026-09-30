import { Router } from 'express';
import { getPoolStatus, getActivePools } from '../controllers/pool.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('DRIVER'), getActivePools);
router.get('/:poolId', getPoolStatus);

export default router;
