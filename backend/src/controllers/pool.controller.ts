import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';

export const getPoolStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { poolId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        tesla: {
          include: { driver: { select: { id: true, name: true, phone: true } } },
        },
        rideRequests: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            passenger: { select: { id: true, name: true } },
            pickupLocation: true,
            destLocation: true,
          },
        },
      },
    });

    if (!pool) throw new NotFoundError('Pool');

    // Passengers can only see their own ride data in the pool, not other passengers
    let responsePool: typeof pool;

    if (userRole === 'PASSENGER') {
      // Filter rides to only show this passenger's data
      responsePool = {
        ...pool,
        rideRequests: pool.rideRequests.filter(r => r.passengerId === userId),
      };
    } else {
      responsePool = pool;
    }

    res.json({ success: true, data: { pool: responsePool } });
  } catch (error) { next(error); }
};

export const getActivePools = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pools = await prisma.pool.findMany({
      where: { status: { in: ['OPEN', 'LOCKED', 'IN_PROGRESS'] } },
      include: {
        tesla: { include: { driver: { select: { name: true } } } },
        rideRequests: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true, status: true, seatsRequested: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { pools } });
  } catch (error) { next(error); }
};
