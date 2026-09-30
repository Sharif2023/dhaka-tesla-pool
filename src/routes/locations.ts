import { Router } from 'express';
import { getLocations, getLocationsByZone } from '../controllers/location.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getLocations);
router.get('/zone/:zone', authenticate, getLocationsByZone);

export default router;
