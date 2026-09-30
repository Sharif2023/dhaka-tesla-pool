// Test setup file
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dhaka_tesla_pool_test';
process.env.JWT_SECRET = 'test-jwt-secret-dhaka-tesla';
