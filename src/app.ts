import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { prisma } from './config/database';

// Routes
import authRoutes from './routes/auth';
import locationRoutes from './routes/locations';
import teslaRoutes from './routes/teslas';
import rideRoutes from './routes/rides';
import poolRoutes from './routes/pools';
import driverRoutes from './routes/driver';
import userRoutes from './routes/users';

const app = express();

// ─── Security middleware ───
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate limiting ───
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── Body parsing & utilities ───
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Logging ───
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
  }));
}

// ─── Health check ───
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'dhaka-tesla-pool-api' });
  } catch {
    res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() });
  }
});

// ─── API routes ───
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/teslas', teslaRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/pools', poolRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/users', userRoutes);

// ─── Error handling ───
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
