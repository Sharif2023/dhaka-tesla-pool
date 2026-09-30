import { Router } from 'express';
import { register, login, getMe, registerValidators, loginValidators } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', registerValidators, register);
router.post('/login', loginValidators, login);
router.get('/me', authenticate, getMe);

export default router;
