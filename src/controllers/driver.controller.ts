import { Response, NextFunction } from 'express';
import { param } from 'express-validator';
import { prisma } from '../config/database';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { handleValidationErrors } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { RideRequestStatus, PoolStatus, TeslaStatus } from '@prisma/client';

// Valid state transitions for driver actions
const DRIVER_TRANSITIONS: Record<string, { from: RideRequestStatus; to: RideRequestStatus }> = {
  accept:  { from: RideRequestStatus.REQUESTED,      to: RideRequestStatus.MATCHED },
  arrive:  { from: RideRequestStatus.MATCHED,         to: RideRequestStatus.DRIVER_ARRIVED },
  start:   { from: RideRequestStatus.DRIVER_ARRIVED,  to: RideRequestStatus.STARTED },
  complete:{ from: RideRequestStatus.STARTED,          to: RideRequestStatus.COMPLETED },
};

export const goOnline = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driverId = req.user!.id;

    const tesla = await prisma.tesla.findFirst({ where: { driverId } });
    if (!tesla) throw new AppError('No Tesla found for this driver', 404);

    await prisma.tesla.update({
      where: { id: tesla.id },
      data: { status: TeslaStatus.ONLINE },
    });

    res.json({ success: true, message: `${tesla.name} is now ONLINE`, data: { teslaId: tesla.id, status: 'ONLINE' } });
  } catch (error) { next(error); }
};

export const goOffline = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driverId = req.user!.id;

    const tesla = await prisma.tesla.findFirst({ where: { driverId } });
    if (!tesla) throw new AppError('No Tesla found for this driver', 404);

    // Can't go offline if on a trip
    if (tesla.status === TeslaStatus.ON_TRIP) {
      throw new AppError('Cannot go offline while on a trip', 409);
    }

    await prisma.tesla.update({
      where: { id: tesla.id },
      data: { status: TeslaStatus.OFFLINE },
    });

    res.json({ success: true, message: `${tesla.name} is now OFFLINE`, data: { teslaId: tesla.id, status: 'OFFLINE' } });
  } catch (error) { next(error); }
};

export const getDriverRequests = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driverId = req.user!.id;

    const tesla = await prisma.tesla.findFirst({ where: { driverId } });
    if (!tesla) throw new NotFoundError('Tesla');

    // Get open pools for this tesla, and also all REQUESTED rides in the same zone
    const pools = await prisma.pool.findMany({
      where: {
        teslaId: tesla.id,
        status: { in: [PoolStatus.OPEN, PoolStatus.LOCKED, PoolStatus.IN_PROGRESS] },
      },
      include: {
        rideRequests: {
          where: { status: { not: RideRequestStatus.CANCELLED } },
          include: {
            passenger: { select: { id: true, name: true, phone: true } },
            pickupLocation: true,
            destLocation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also get unmatched REQUESTED rides in same zone (that can be accepted)
    const unmatchedRequests = await prisma.rideRequest.findMany({
      where: {
        status: RideRequestStatus.REQUESTED,
        pool: {
          pickupZone: tesla.status === TeslaStatus.ONLINE ? undefined : 'IMPOSSIBLE',
          status: PoolStatus.OPEN,
          teslaId: tesla.id,
        },
      },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
        pickupLocation: true,
        destLocation: true,
        pool: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: {
        tesla: {
          id: tesla.id,
          name: tesla.name,
          licensePlate: tesla.licensePlate,
          capacity: tesla.capacity,
          status: tesla.status,
        },
        activePools: pools,
        pendingRequests: unmatchedRequests,
      },
    });
  } catch (error) { next(error); }
};

export const acceptPool = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { poolId } = req.params;
    const driverId = req.user!.id;

    const tesla = await prisma.tesla.findFirst({ where: { driverId } });
    if (!tesla) throw new NotFoundError('Tesla');
    if (tesla.status !== TeslaStatus.ONLINE) throw new AppError('You must be online to accept rides', 409);

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        rideRequests: { where: { status: { not: RideRequestStatus.CANCELLED } } },
      },
    });

    if (!pool) throw new NotFoundError('Pool');
    if (pool.teslaId !== tesla.id) throw new ForbiddenError('This pool is not assigned to your Tesla');
    if (pool.status !== PoolStatus.OPEN) throw new AppError(`Pool is already ${pool.status}`, 409);

    await prisma.$transaction(async (tx) => {
      // Lock pool — no more passengers can join
      await tx.pool.update({
        where: { id: poolId },
        data: { status: PoolStatus.LOCKED },
      });

      // Update all REQUESTED rides in this pool to MATCHED
      await tx.rideRequest.updateMany({
        where: { poolId, status: RideRequestStatus.REQUESTED },
        data: { status: RideRequestStatus.MATCHED, matchedAt: new Date() },
      });

      // Create status history entries
      const requestIds = pool.rideRequests
        .filter(r => r.status === RideRequestStatus.REQUESTED)
        .map(r => r.id);

      await tx.rideStatusHistory.createMany({
        data: requestIds.map(rideRequestId => ({
          rideRequestId,
          fromStatus: RideRequestStatus.REQUESTED,
          toStatus: RideRequestStatus.MATCHED,
          changedBy: driverId,
        })),
      });
    });

    logger.info(`Driver ${req.user!.name} accepted pool ${poolId}`);

    res.json({ success: true, message: 'Pool accepted — passengers notified', data: { poolId, status: 'LOCKED' } });
  } catch (error) { next(error); }
};

export const updatePoolStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { poolId, action } = req.params;
    const driverId = req.user!.id;

    const transition = DRIVER_TRANSITIONS[action];
    if (!transition) throw new AppError(`Invalid action: ${action}`, 400);

    const tesla = await prisma.tesla.findFirst({ where: { driverId } });
    if (!tesla) throw new NotFoundError('Tesla');

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        rideRequests: { where: { status: { not: RideRequestStatus.CANCELLED } } },
        tesla: true,
      },
    });

    if (!pool) throw new NotFoundError('Pool');
    if (pool.teslaId !== tesla.id) throw new ForbiddenError('This pool is not assigned to your Tesla');

    // Validate that all rides can transition
    const eligibleRides = pool.rideRequests.filter(r => r.status === transition.from);
    if (eligibleRides.length === 0) {
      throw new AppError(`No rides in status ${transition.from} to transition`, 409);
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // Transition all eligible rides
      await tx.rideRequest.updateMany({
        where: { poolId, status: transition.from },
        data: {
          status: transition.to,
          ...(transition.to === RideRequestStatus.MATCHED && { matchedAt: now }),
          ...(transition.to === RideRequestStatus.DRIVER_ARRIVED && { arrivedAt: now }),
          ...(transition.to === RideRequestStatus.STARTED && { startedAt: now }),
          ...(transition.to === RideRequestStatus.COMPLETED && { completedAt: now, paymentStatus: 'PAID' }),
        },
      });

      // History
      await tx.rideStatusHistory.createMany({
        data: eligibleRides.map(r => ({
          rideRequestId: r.id,
          fromStatus: transition.from,
          toStatus: transition.to,
          changedBy: driverId,
        })),
      });

      // Update pool status
      if (action === 'arrive') {
        // Pool status stays LOCKED on arrive
      } else if (action === 'start') {
        await tx.pool.update({ where: { id: poolId }, data: { status: PoolStatus.IN_PROGRESS, startedAt: now } });
        await tx.tesla.update({ where: { id: tesla.id }, data: { status: TeslaStatus.ON_TRIP } });
      } else if (action === 'complete') {
        await tx.pool.update({ where: { id: poolId }, data: { status: PoolStatus.COMPLETED, completedAt: now } });
        await tx.tesla.update({ where: { id: tesla.id }, data: { status: TeslaStatus.ONLINE } });

        // Create payment records
        await Promise.all(eligibleRides.map(r =>
          tx.payment.upsert({
            where: { rideRequestId: r.id },
            update: { status: 'PAID' },
            create: {
              rideRequestId: r.id,
              amountPaisa: r.totalFarePaisa || 0,
              method: r.paymentMethod,
              status: 'PAID',
            },
          })
        ));
      }
    });

    logger.info(`Driver ${req.user!.name} performed action '${action}' on pool ${poolId}`);

    res.json({ success: true, message: `Action '${action}' applied to pool`, data: { poolId, action, newRideStatus: transition.to } });
  } catch (error) { next(error); }
};

export const getDriverHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const driverId = req.user!.id;

    const tesla = await prisma.tesla.findFirst({ where: { driverId } });
    if (!tesla) throw new NotFoundError('Tesla');

    const pools = await prisma.pool.findMany({
      where: { teslaId: tesla.id, status: { in: [PoolStatus.COMPLETED, PoolStatus.CANCELLED] } },
      include: {
        rideRequests: {
          include: {
            passenger: { select: { name: true } },
            pickupLocation: true,
            destLocation: true,
            payment: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });

    res.json({ success: true, data: { tesla, pools } });
  } catch (error) { next(error); }
};
