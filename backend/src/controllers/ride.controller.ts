import { Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { prisma } from '../config/database';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { handleValidationErrors } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateFare } from '../utils/fare';
import { config } from '../config';
import { logger } from '../utils/logger';
import { RideRequestStatus, PoolStatus } from '@prisma/client';

// ─── Validators ───
export const requestRideValidators = [
  body('pickupLocationId').notEmpty().withMessage('Pickup location required'),
  body('destLocationId').notEmpty().withMessage('Destination required'),
  body('seatsRequested').isInt({ min: 1, max: 3 }).withMessage('Seats must be 1-3'),
  body('paymentMethod').optional().isIn(['CASH', 'TESLA_PAY']),
  body('notes').optional().isString().isLength({ max: 200 }),
  handleValidationErrors,
];

export const cancelRideValidators = [
  param('id').notEmpty(),
  body('reason').optional().isString().isLength({ max: 200 }),
  handleValidationErrors,
];

// ─── Controllers ───
export const requestRide = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pickupLocationId, destLocationId, seatsRequested = 1, paymentMethod = 'CASH', notes } = req.body;
    const passengerId = req.user!.id;

    // Validate locations exist
    const [pickup, dest] = await Promise.all([
      prisma.location.findUnique({ where: { id: pickupLocationId } }),
      prisma.location.findUnique({ where: { id: destLocationId } }),
    ]);
    if (!pickup) throw new AppError('Pickup location not found', 404);
    if (!dest) throw new AppError('Destination not found', 404);
    if (pickupLocationId === destLocationId) throw new AppError('Pickup and destination cannot be the same', 400);

    // Check passenger has no active rides
    const activeRide = await prisma.rideRequest.findFirst({
      where: {
        passengerId,
        status: { in: ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'] },
      },
    });
    if (activeRide) throw new AppError('You already have an active ride request', 409);

    // Find an open pool in the same zone OR create a new one
    // Pool matching rule: same pickup zone, pool status OPEN, available seats
    const result = await prisma.$transaction(async (tx) => {
      // Try to find a matchable open pool
      // Matching rule: same pickup zone, status OPEN, enough remaining seats
      const existingPool = await tx.pool.findFirst({
        where: {
          pickupZone: pickup.zone,
          status: PoolStatus.OPEN,
          tesla: { status: 'ONLINE' },
        },
        include: {
          tesla: true,
          rideRequests: { where: { status: { not: 'CANCELLED' } } },
        },
        orderBy: { createdAt: 'asc' }, // FIFO matching
      });

      let pool;
      let isNewPool = false;

      if (existingPool) {
        const seatsRemaining = existingPool.tesla.capacity - existingPool.seatsOccupied;
        if (seatsRemaining >= seatsRequested) {
          // Join existing pool — UPDATE seatsOccupied atomically
          // This prevents overbooking via DB constraint + transaction lock
          pool = await tx.pool.update({
            where: {
              id: existingPool.id,
              // Optimistic lock: ensure seats still available
              seatsOccupied: { lte: existingPool.tesla.capacity - seatsRequested },
            },
            data: {
              seatsOccupied: { increment: seatsRequested },
            },
          });

          if (!pool) {
            // Race condition: another request took the seat; fall through to new pool
            isNewPool = true;
          }
        } else {
          isNewPool = true;
        }
      } else {
        isNewPool = true;
      }

      if (isNewPool || !pool) {
        // Find any online tesla with enough capacity
        const availableTesla = await tx.tesla.findFirst({
          where: {
            status: 'ONLINE',
            capacity: { gte: seatsRequested },
          },
        });

        // Create new pool (even without a tesla yet — it will be assigned when driver accepts)
        pool = await tx.pool.create({
          data: {
            teslaId: availableTesla?.id || (await tx.tesla.findFirst({ where: { status: 'ONLINE' } }))!.id,
            pickupZone: pickup.zone,
            seatsOccupied: seatsRequested,
            status: PoolStatus.OPEN,
          },
        });
        isNewPool = true;
      }

      // Calculate fare
      const isPool = !isNewPool; // pooled if joined existing pool
      const fare = calculateFare({
        pickupLat: pickup.lat, pickupLng: pickup.lng,
        destLat: dest.lat, destLng: dest.lng,
        isPool,
        ...config.fare,
      });

      // Create ride request
      const rideRequest = await tx.rideRequest.create({
        data: {
          passengerId,
          poolId: pool.id,
          pickupLocationId,
          destLocationId,
          seatsRequested,
          status: RideRequestStatus.REQUESTED,
          baseFarePaisa: fare.baseFarePaisa,
          distanceChargePaisa: fare.distanceChargePaisa,
          poolDiscountPaisa: fare.poolDiscountPaisa,
          totalFarePaisa: fare.totalFarePaisa,
          paymentMethod: paymentMethod as 'CASH' | 'TESLA_PAY',
          notes,
        },
        include: {
          pickupLocation: true,
          destLocation: true,
          pool: { include: { tesla: { include: { driver: { select: { name: true, phone: true } } } } } },
        },
      });

      // Record status history
      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: rideRequest.id,
          toStatus: RideRequestStatus.REQUESTED,
          changedBy: passengerId,
        },
      });

      return { rideRequest, isPool, distanceMeters: fare.distanceMeters };
    });

    logger.info(`Ride requested: ${result.rideRequest.id} by ${req.user!.name} (${result.isPool ? 'pooled' : 'new pool'})`);

    res.status(201).json({
      success: true,
      message: result.isPool ? 'Ride matched to existing pool' : 'Ride requested — waiting for driver',
      data: {
        ride: result.rideRequest,
        isPooled: result.isPool,
        distanceMeters: result.distanceMeters,
        fareBreakdown: {
          baseFareBDT: (result.rideRequest.baseFarePaisa! / 100).toFixed(2),
          distanceChargeBDT: (result.rideRequest.distanceChargePaisa! / 100).toFixed(2),
          poolDiscountBDT: (result.rideRequest.poolDiscountPaisa! / 100).toFixed(2),
          totalFareBDT: (result.rideRequest.totalFarePaisa! / 100).toFixed(2),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRides = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const passengerId = req.user!.id;
    const { status, limit = '20', offset = '0' } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { passengerId };
    if (status) where.status = status;

    const [rides, total] = await Promise.all([
      prisma.rideRequest.findMany({
        where,
        include: {
          pickupLocation: true,
          destLocation: true,
          pool: {
            include: {
              tesla: {
                select: { name: true, licensePlate: true, driver: { select: { name: true, phone: true } } },
              },
            },
          },
          statusHistory: { orderBy: { createdAt: 'asc' } },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit), 50),
        skip: parseInt(offset),
      }),
      prisma.rideRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: { rides, total, limit: parseInt(limit), offset: parseInt(offset) },
    });
  } catch (error) {
    next(error);
  }
};

export const getRideById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const ride = await prisma.rideRequest.findUnique({
      where: { id },
      include: {
        pickupLocation: true,
        destLocation: true,
        pool: {
          include: {
            tesla: {
              include: { driver: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payment: true,
        // Exclude other passengers' data — only show this ride's passenger
      },
    });

    if (!ride) throw new NotFoundError('Ride');

    // Passengers can only see their own rides
    if (userRole === 'PASSENGER' && ride.passengerId !== userId) {
      throw new ForbiddenError('You can only view your own rides');
    }

    res.json({ success: true, data: { ride } });
  } catch (error) {
    next(error);
  }
};

export const cancelRide = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const ride = await prisma.rideRequest.findUnique({
      where: { id },
      include: { pool: true },
    });

    if (!ride) throw new NotFoundError('Ride');

    // Authorization: passengers can cancel their own rides; drivers can cancel any ride in their pool
    if (userRole === 'PASSENGER' && ride.passengerId !== userId) {
      throw new ForbiddenError('You can only cancel your own rides');
    }

    // Can only cancel if not already started or completed
    const cancellableStatuses: RideRequestStatus[] = ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED'];
    if (!cancellableStatuses.includes(ride.status)) {
      throw new AppError(`Cannot cancel a ride with status ${ride.status}`, 409);
    }

    await prisma.$transaction(async (tx) => {
      await tx.rideRequest.update({
        where: { id },
        data: {
          status: RideRequestStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      });

      // Release seats in pool
      if (ride.poolId) {
        const pool = await tx.pool.findUnique({ where: { id: ride.poolId } });
        if (pool && pool.status !== 'COMPLETED' && pool.status !== 'CANCELLED') {
          const newSeatsOccupied = Math.max(0, pool.seatsOccupied - ride.seatsRequested);
          // If no more passengers, cancel the pool too
          const remainingRides = await tx.rideRequest.count({
            where: { poolId: ride.poolId, status: { not: 'CANCELLED' }, id: { not: id } },
          });

          if (remainingRides === 0) {
            await tx.pool.update({
              where: { id: ride.poolId },
              data: { status: PoolStatus.CANCELLED, seatsOccupied: 0 },
            });
          } else {
            await tx.pool.update({
              where: { id: ride.poolId },
              data: { seatsOccupied: newSeatsOccupied },
            });
          }
        }
      }

      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: id,
          fromStatus: ride.status,
          toStatus: RideRequestStatus.CANCELLED,
          changedBy: userId,
          reason,
        },
      });
    });

    logger.info(`Ride cancelled: ${id} by ${req.user!.name}`);

    res.json({ success: true, message: 'Ride cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

export const estimateFare = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pickupLocationId, destLocationId } = req.query as Record<string, string>;

    const [pickup, dest] = await Promise.all([
      prisma.location.findUnique({ where: { id: pickupLocationId } }),
      prisma.location.findUnique({ where: { id: destLocationId } }),
    ]);

    if (!pickup || !dest) throw new AppError('Invalid locations', 400);

    const soloFare = calculateFare({
      pickupLat: pickup.lat, pickupLng: pickup.lng,
      destLat: dest.lat, destLng: dest.lng,
      isPool: false,
      ...config.fare,
    });

    const poolFare = calculateFare({
      pickupLat: pickup.lat, pickupLng: pickup.lng,
      destLat: dest.lat, destLng: dest.lng,
      isPool: true,
      ...config.fare,
    });

    res.json({
      success: true,
      data: {
        pickup: { id: pickup.id, name: pickup.name },
        destination: { id: dest.id, name: dest.name },
        distanceMeters: soloFare.distanceMeters,
        soloFare: {
          totalBDT: (soloFare.totalFarePaisa / 100).toFixed(2),
          breakdown: {
            baseFareBDT: (soloFare.baseFarePaisa / 100).toFixed(2),
            distanceChargeBDT: (soloFare.distanceChargePaisa / 100).toFixed(2),
            poolDiscountBDT: '0.00',
          },
        },
        poolFare: {
          totalBDT: (poolFare.totalFarePaisa / 100).toFixed(2),
          breakdown: {
            baseFareBDT: (poolFare.baseFarePaisa / 100).toFixed(2),
            distanceChargeBDT: (poolFare.distanceChargePaisa / 100).toFixed(2),
            poolDiscountBDT: (poolFare.poolDiscountPaisa / 100).toFixed(2),
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
