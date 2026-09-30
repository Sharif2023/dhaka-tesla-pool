import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { config } from '../config';
import { AppError } from '../utils/errors';
import { handleValidationErrors } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

import { TeslaStatus } from '@prisma/client';

// ─── Validators ───
export const registerValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .customSanitizer((val: string) => {
      let cleaned = String(val || '').replace(/[\s\-()]/g, '');
      if (cleaned.startsWith('01')) {
        cleaned = '+8801' + cleaned.slice(2);
      } else if (cleaned.startsWith('8801')) {
        cleaned = '+' + cleaned;
      }
      return cleaned;
    })
    .matches(/^\+8801[3-9]\d{8}$/)
    .withMessage('Valid Bangladeshi phone number required (+8801XXXXXXXXX or 01XXXXXXXXX)'),
  body('email')
    .optional({ checkFalsy: true, nullable: true })
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['PASSENGER', 'DRIVER'])
    .withMessage('Role must be PASSENGER or DRIVER'),
  handleValidationErrors,
];

export const loginValidators = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .customSanitizer((val: string) => {
      let cleaned = String(val || '').replace(/[\s\-()]/g, '');
      if (cleaned.startsWith('01')) {
        cleaned = '+8801' + cleaned.slice(2);
      } else if (cleaned.startsWith('8801')) {
        cleaned = '+' + cleaned;
      }
      return cleaned;
    }),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// ─── Controllers ───
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone, email, password, role } = req.body;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    });

    if (existing) {
      throw new AppError('User with this phone or email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, phone, email: email || null, passwordHash, role },
        select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true },
      });

      // Create wallet for all users
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balancePaisa: 0,
        },
      });

      // If registered as driver, auto-provision their Tesla vehicle
      if (role === 'DRIVER') {
        const count = await tx.tesla.count();
        const num = String(count + 1).padStart(3, '0');
        await tx.tesla.create({
          data: {
            driverId: newUser.id,
            name: `${name.split(' ')[0]}'s Tesla`,
            licensePlate: `DHAKA-TESLA-${num}`,
            capacity: 3,
            status: TeslaStatus.OFFLINE,
            currentLat: 23.7937,
            currentLng: 90.4066,
          },
        });
      }

      return newUser;
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    logger.info(`New user registered: ${user.name} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, email: true, role: true, passwordHash: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError('Invalid phone or password', 401);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _ph, ...userWithoutPassword } = user;

    logger.info(`User logged in: ${user.name} (${user.role})`);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request & { user?: { id: string } }, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, phone: true, email: true, role: true, createdAt: true,
        wallet: { select: { balancePaisa: true } },
        teslas: { select: { id: true, name: true, licensePlate: true, capacity: true, status: true } },
      },
    });

    if (!user) throw new AppError('User not found', 404);

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};
