import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, phone: true, email: true, role: true, createdAt: true,
        wallet: {
          select: {
            balancePaisa: true,
            transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        },
      },
    });
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

export const getWallet = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.id },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    res.json({
      success: true,
      data: {
        wallet: {
          ...wallet,
          balanceBDT: wallet ? (wallet.balancePaisa / 100).toFixed(2) : '0.00',
        },
      },
    });
  } catch (error) { next(error); }
};
