import { Router } from 'express';
import {
  requestRide, getMyRides, getRideById, cancelRide, estimateFare,
  requestRideValidators, cancelRideValidators,
} from '../controllers/ride.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All ride routes require authentication
router.use(authenticate);

router.get('/estimate', estimateFare);
router.post('/', requireRole('PASSENGER'), requestRideValidators, requestRide);
router.get('/', requireRole('PASSENGER'), getMyRides);
router.get('/:id', getRideById);
router.patch('/:id/cancel', requireRole('PASSENGER', 'DRIVER'), cancelRideValidators, cancelRide);

export default router;
