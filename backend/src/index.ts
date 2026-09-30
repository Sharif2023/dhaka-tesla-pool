import { app } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './config/database';

async function bootstrap() {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✓ Database connected');

    const server = app.listen(config.port, () => {
      logger.info(`✓ Dhaka Tesla Pool API running on port ${config.port}`);
      logger.info(`  Environment: ${config.nodeEnv}`);
      logger.info(`  Health: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected. Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
