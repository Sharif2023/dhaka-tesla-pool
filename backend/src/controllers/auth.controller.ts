import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { prisma } from '../config/database';
import { config } from '../config';
import { AppError } from '../utils/errors';
import { handleValidationErrors } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// ─── Validators ───
export const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('phone').trim().notEmpty().matches(/^\+8801[3-9]\d{8}$/).withMessage('Valid BD phone required (+8801XXXXXXXXX)'),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['PASSENGER', 'DRIVER']).withMessage('Role must be PASSENGER or DRIVER'),
  handleValidationErrors,
];

export const loginValidators = [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
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
        data: { name, phone, email, passwordHash, role },
        select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true },
      });

      // Create wallet for all users
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balancePaisa: 0,
        },
      });

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
