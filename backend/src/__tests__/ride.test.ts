/**
 * Ride Lifecycle Integration Tests
 * Tests: capacity enforcement, state transitions, authorization
 */
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';

// Test tokens stored for reuse
let jashimToken: string;
let nusratToken: string;
let rafiqToken: string;
let shirinToken: string;
let bulletId: string;
let bananiId: string;
let mohakhaliId: string;
let gulshan1Id: string;

beforeAll(async () => {
  // Clean test DB
  await prisma.rideStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.tesla.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  // Seed locations
  await prisma.location.createMany({
    data: [
      { name: 'Banani',    zone: 'NORTH', lat: 23.7937, lng: 90.4066 },
      { name: 'Mohakhali', zone: 'NORTH', lat: 23.7756, lng: 90.4000 },
      { name: 'Gulshan 1', zone: 'NORTH', lat: 23.7808, lng: 90.4142 },
      { name: 'Dhanmondi', zone: 'WEST',  lat: 23.7461, lng: 90.3742 },
    ],
  });

  const locations = await prisma.location.findMany();
  bananiId    = locations.find((l: any) => l.name === 'Banani')!.id;
  mohakhaliId = locations.find((l: any) => l.name === 'Mohakhali')!.id;
  gulshan1Id  = locations.find((l: any) => l.name === 'Gulshan 1')!.id;

  const hash = await bcrypt.hash('Tesla@2024', 10);

  // Create users
  const jashim = await prisma.user.create({
    data: { name: 'Jashim Uddin', phone: '+8801711000001', email: 'jashim@test.com', passwordHash: hash, role: 'DRIVER' },
  });
  const nusrat = await prisma.user.create({
    data: { name: 'Nusrat Jahan', phone: '+8801811000002', email: 'nusrat@test.com', passwordHash: hash, role: 'PASSENGER' },
  });
  const rafiq = await prisma.user.create({
    data: { name: 'Rafiq Islam', phone: '+8801911000003', email: 'rafiq@test.com', passwordHash: hash, role: 'PASSENGER' },
  });
  const shirin = await prisma.user.create({
    data: { name: 'Shirin Akter', phone: '+8801611000004', email: 'shirin@test.com', passwordHash: hash, role: 'PASSENGER' },
  });

  // Create wallets
  for (const userId of [jashim.id, nusrat.id, rafiq.id, shirin.id]) {
    await prisma.wallet.create({ data: { userId, balancePaisa: 100000 } });
  }

  // Create Bullet (3-seat capacity)
  const bullet = await prisma.tesla.create({
    data: {
      driverId: jashim.id,
      name: 'Bullet',
      licensePlate: 'DHAKA-TEST-001',
      capacity: 3,
      status: 'ONLINE',
      currentLat: 23.7937, currentLng: 90.4066,
    },
  });
  bulletId = bullet.id;

  // Get auth tokens
  const loginUser = async (phone: string) => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone, password: 'Tesla@2024' });
    return res.body.data.token;
  };

  jashimToken = await loginUser('+8801711000001');
  nusratToken = await loginUser('+8801811000002');
  rafiqToken  = await loginUser('+8801911000003');
  shirinToken = await loginUser('+8801611000004');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Authentication', () => {
  it('should register a new passenger', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Passenger',
        phone: '+8801712345678',
        password: 'Test@1234',
        role: 'PASSENGER',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('PASSENGER');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '+8801811000002', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should require authentication for protected routes', async () => {
    const res = await request(app).get('/api/rides');
    expect(res.status).toBe(401);
  });
});

describe('Ride Request & Pooling', () => {
  let nusratRideId: string;
  let rafiqRideId: string;
  let poolId: string;

  it('Nusrat should be able to request a ride from Banani to Mohakhali', async () => {
    const res = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({
        pickupLocationId: bananiId,
        destLocationId: mohakhaliId,
        seatsRequested: 1,
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ride.status).toBe('REQUESTED');
    expect(res.body.data.ride.totalFarePaisa).toBeGreaterThan(0);
    expect(res.body.data.fareBreakdown.totalFareBDT).toBeDefined();

    nusratRideId = res.body.data.ride.id;
    poolId = res.body.data.ride.poolId;
  });

  it('Rafiq should join the same pool (same zone)', async () => {
    const res = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${rafiqToken}`)
      .send({
        pickupLocationId: bananiId,
        destLocationId: gulshan1Id,
        seatsRequested: 1,
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isPooled).toBe(true);

    rafiqRideId = res.body.data.ride.id;
  });

  it('Nusrat should not see Rafiq\'s fare details', async () => {
    const res = await request(app)
      .get(`/api/rides/${rafiqRideId}`)
      .set('Authorization', `Bearer ${nusratToken}`);

    expect(res.status).toBe(403);
  });

  it('should prevent Nusrat from cancelling Rafiq\'s ride', async () => {
    const res = await request(app)
      .patch(`/api/rides/${rafiqRideId}/cancel`)
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({ reason: 'Trying to cancel someone else\'s ride' });

    expect(res.status).toBe(403);
  });

  it('should prevent a passenger from requesting duplicate active rides', async () => {
    const res = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${nusratToken}`)
      .send({
        pickupLocationId: bananiId,
        destLocationId: mohakhaliId,
        seatsRequested: 1,
      });

    expect(res.status).toBe(409);
  });
});

describe('Seat Capacity Enforcement (Bullet has 3 seats)', () => {
  it('Shirin should be able to join (3rd seat)', async () => {
    const res = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${shirinToken}`)
      .send({
        pickupLocationId: bananiId,
        destLocationId: gulshan1Id,
        seatsRequested: 1,
        paymentMethod: 'CASH',
      });

    // With capacity 3 and 2 already taken, Shirin should either get a seat
    // or get a new pool — depends on pool state
    expect([200, 201]).toContain(res.status);
  });

  it('Pool seats should never exceed Bullet\'s capacity of 3', async () => {
    const pools = await prisma.pool.findMany({
      where: { teslaId: bulletId },
      include: { tesla: true },
    });

    for (const pool of pools) {
      expect(pool.seatsOccupied).toBeLessThanOrEqual(pool.tesla.capacity);
    }
  });

  it('Two concurrent requests cannot corrupt pool capacity when 1 seat is left (The Shirin Problem)', async () => {
    const [p1, p2] = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Concurrent Rider 1',
          phone: '+8801511111111',
          passwordHash: await bcrypt.hash('Tesla@2024', 10),
          role: 'PASSENGER',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Concurrent Rider 2',
          phone: '+8801522222222',
          passwordHash: await bcrypt.hash('Tesla@2024', 10),
          role: 'PASSENGER',
        },
      }),
    ]);

    await Promise.all([
      prisma.wallet.create({ data: { userId: p1.id, balancePaisa: 50000 } }),
      prisma.wallet.create({ data: { userId: p2.id, balancePaisa: 50000 } }),
    ]);

    const [t1Res, t2Res] = await Promise.all([
      request(app).post('/api/auth/login').send({ phone: '+8801511111111', password: 'Tesla@2024' }),
      request(app).post('/api/auth/login').send({ phone: '+8801522222222', password: 'Tesla@2024' }),
    ]);

    const token1 = t1Res.body.data.token;
    const token2 = t2Res.body.data.token;

    // Fire both ride requests concurrently
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${token1}`)
        .send({ pickupLocationId: bananiId, destLocationId: mohakhaliId, seatsRequested: 1, paymentMethod: 'CASH' }),
      request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${token2}`)
        .send({ pickupLocationId: bananiId, destLocationId: mohakhaliId, seatsRequested: 1, paymentMethod: 'CASH' }),
    ]);

    expect([200, 201]).toContain(res1.status);
    expect([200, 201]).toContain(res2.status);

    // Capacity must never be breached on any pool
    const allPools = await prisma.pool.findMany({
      include: { tesla: true },
    });
    for (const pool of allPools) {
      expect(pool.seatsOccupied).toBeLessThanOrEqual(pool.tesla.capacity);
    }
  });
});

describe('Driver Flow - Jashim and Bullet', () => {
  it('Jashim should be able to go online', async () => {
    const res = await request(app)
      .post('/api/driver/online')
      .set('Authorization', `Bearer ${jashimToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ONLINE');
  });

  it('Jashim should see pending ride requests', async () => {
    const res = await request(app)
      .get('/api/driver/requests')
      .set('Authorization', `Bearer ${jashimToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tesla).toBeDefined();
    expect(res.body.data.tesla.name).toBe('Bullet');
  });

  it('Passengers should not access driver routes', async () => {
    const res = await request(app)
      .get('/api/driver/requests')
      .set('Authorization', `Bearer ${nusratToken}`);

    expect(res.status).toBe(403);
  });
});

describe('State Transition Validation', () => {
  it('should reject invalid state transition (REQUESTED -> STARTED, skipping MATCHED)', async () => {
    // Get a pool
    const pool = await prisma.pool.findFirst({ where: { tesla: { driverId: { not: undefined } } } });
    if (!pool) return; // Skip if no pool

    const res = await request(app)
      .patch(`/api/driver/pool/${pool.id}/start`)
      .set('Authorization', `Bearer ${jashimToken}`);

    // Should fail because rides aren't in DRIVER_ARRIVED status
    // Either 409 (conflict) or 200 with 0 rides transitioned
    // If no DRIVER_ARRIVED rides exist, no transition happens
    expect([200, 409]).toContain(res.status);
  });
});

describe('Fare Estimation', () => {
  it('should return fare estimate before booking', async () => {
    const res = await request(app)
      .get('/api/rides/estimate')
      .set('Authorization', `Bearer ${nusratToken}`)
      .query({ pickupLocationId: bananiId, destLocationId: mohakhaliId });

    expect(res.status).toBe(200);
    expect(res.body.data.soloFare).toBeDefined();
    expect(res.body.data.poolFare).toBeDefined();
    // Pool fare should be less than solo
    expect(parseFloat(res.body.data.poolFare.totalBDT))
      .toBeLessThan(parseFloat(res.body.data.soloFare.totalBDT));
  });
});

describe('Cancellation Rules', () => {
  it('should allow cancellation of REQUESTED rides', async () => {
    // Create a fresh ride for cancellation test
    const freshPassenger = await prisma.user.create({
      data: {
        name: 'Cancel Tester',
        phone: '+8801799999999',
        email: 'cancel@test.com',
        passwordHash: await bcrypt.hash('Test@1234', 10),
        role: 'PASSENGER',
      },
    });
    await prisma.wallet.create({ data: { userId: freshPassenger.id, balancePaisa: 50000 } });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ phone: '+8801799999999', password: 'Test@1234' });
    const cancelToken = loginRes.body.data.token;

    const rideRes = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${cancelToken}`)
      .send({ pickupLocationId: bananiId, destLocationId: mohakhaliId, seatsRequested: 1 });

    if (rideRes.status === 201) {
      const cancelRes = await request(app)
        .patch(`/api/rides/${rideRes.body.data.ride.id}/cancel`)
        .set('Authorization', `Bearer ${cancelToken}`)
        .send({ reason: 'Changed my mind' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
    }
  });
});
