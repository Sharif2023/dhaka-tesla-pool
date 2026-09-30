import { Router } from 'express';
import { getProfile, getWallet } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.get('/wallet', getWallet);

export default router;
