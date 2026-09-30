import { Router } from 'express';
import { getMyTesla, createTesla, getAllTeslas, createTeslaValidators } from '../controllers/tesla.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('DRIVER'), getAllTeslas);
router.get('/mine', requireRole('DRIVER'), getMyTesla);
router.post('/', requireRole('DRIVER'), createTeslaValidators, createTesla);

export default router;
