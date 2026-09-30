import { Router } from 'express';
import {
  goOnline, goOffline, getDriverRequests, acceptPool,
  updatePoolStatus, getDriverHistory,
} from '../controllers/driver.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireRole('DRIVER'));

router.post('/online', goOnline);
router.post('/offline', goOffline);
router.get('/requests', getDriverRequests);
router.post('/pool/:poolId/accept', acceptPool);
router.patch('/pool/:poolId/:action', updatePoolStatus);  // action: arrive | start | complete
router.get('/history', getDriverHistory);

export default router;
