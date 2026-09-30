import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dhaka-tesla-pool-dev-secret-change-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Fare model constants (in paisa)
  fare: {
    baseFarePaisa: 3000,           // 30 BDT base fare
    perMeterChargePaisa: 3,        // 3 paisa per meter (= 30 BDT per km)
    poolDiscountPaisa: 800,        // 8 BDT discount for pool rides
    minFarePaisa: 3000,            // minimum 30 BDT
  },

  // Pool matching config
  pool: {
    sameZoneRequired: true,         // pickup must be in same zone
    maxWaitMinutes: 5,             // max wait before pool is locked
  },
};

export type Config = typeof config;
