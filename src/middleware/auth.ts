import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; role: string; name: string };

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, name: true },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = { id: user.id, role: user.role, name: user.name };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};
