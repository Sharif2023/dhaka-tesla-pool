import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import { AppError, NotFoundError } from '../utils/errors';

export const createTeslaValidators = [
  body('name').trim().notEmpty().withMessage('Tesla name required'),
  body('licensePlate').trim().notEmpty().withMessage('License plate required'),
  body('capacity').isInt({ min: 1, max: 6 }).withMessage('Capacity must be 1-6'),
  handleValidationErrors,
];

export const getMyTesla = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tesla = await prisma.tesla.findFirst({
      where: { driverId: req.user!.id },
      include: {
        driver: { select: { name: true, phone: true } },
        pools: {
          where: { status: { in: ['OPEN', 'LOCKED', 'IN_PROGRESS'] } },
          include: {
            rideRequests: {
              where: { status: { not: 'CANCELLED' } },
              include: { passenger: { select: { name: true, phone: true } }, pickupLocation: true, destLocation: true },
            },
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tesla) throw new NotFoundError('Tesla');

    res.json({ success: true, data: { tesla } });
  } catch (error) { next(error); }
};

export const createTesla = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, licensePlate, capacity } = req.body;
    const driverId = req.user!.id;

    const existing = await prisma.tesla.findFirst({ where: { driverId } });
    if (existing) throw new AppError('You already have a Tesla registered', 409);

    const existingPlate = await prisma.tesla.findUnique({ where: { licensePlate } });
    if (existingPlate) throw new AppError('License plate already registered', 409);

    const tesla = await prisma.tesla.create({
      data: { driverId, name, licensePlate, capacity },
    });

    res.status(201).json({ success: true, message: 'Tesla registered successfully', data: { tesla } });
  } catch (error) { next(error); }
};

export const getAllTeslas = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teslas = await prisma.tesla.findMany({
      include: { driver: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { teslas } });
  } catch (error) { next(error); }
};
