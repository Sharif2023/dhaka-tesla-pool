import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const getLocations = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: [{ zone: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: { locations } });
  } catch (error) { next(error); }
};

export const getLocationsByZone = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { zone } = req.params;
    const locations = await prisma.location.findMany({
      where: { zone: zone.toUpperCase() },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: { locations } });
  } catch (error) { next(error); }
};
