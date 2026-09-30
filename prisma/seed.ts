/**
 * Dhaka Tesla Pool - Seed Data
 * Story cast: Jashim (driver), Bullet (Tesla), Nusrat, Rafiq, Shirin (passengers)
 */

import { PrismaClient, UserRole, TeslaStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Dhaka Tesla Pool database...\n');

  // ─── Clean up existing data (for idempotent re-seeding) ───
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.rideStatusHistory.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.tesla.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  console.log('✓ Cleared existing data');

  // ─── Locations (predefined Dhaka areas) ───
  const locations = await prisma.location.createMany({
    data: [
      // NORTH zone
      { name: 'Banani',       zone: 'NORTH',   lat: 23.7937, lng: 90.4066 },
      { name: 'Gulshan 1',    zone: 'NORTH',   lat: 23.7808, lng: 90.4142 },
      { name: 'Gulshan 2',    zone: 'NORTH',   lat: 23.7936, lng: 90.4162 },
      { name: 'Mohakhali',    zone: 'NORTH',   lat: 23.7756, lng: 90.4000 },
      { name: 'Uttara',       zone: 'NORTH',   lat: 23.8759, lng: 90.3795 },
      { name: 'Bashundhara',  zone: 'NORTH',   lat: 23.8126, lng: 90.4254 },

      // CENTRAL zone
      { name: 'Farmgate',     zone: 'CENTRAL', lat: 23.7584, lng: 90.3909 },
      { name: 'Karwan Bazar', zone: 'CENTRAL', lat: 23.7514, lng: 90.3928 },
      { name: 'Tejgaon',      zone: 'CENTRAL', lat: 23.7639, lng: 90.4052 },

      // WEST zone
      { name: 'Dhanmondi',    zone: 'WEST',    lat: 23.7461, lng: 90.3742 },
      { name: 'Mirpur',       zone: 'WEST',    lat: 23.8041, lng: 90.3667 },
      { name: 'Shyamoli',     zone: 'WEST',    lat: 23.7738, lng: 90.3629 },

      // SOUTH zone
      { name: 'Motijheel',    zone: 'SOUTH',   lat: 23.7279, lng: 90.4181 },
      { name: 'Paltan',       zone: 'SOUTH',   lat: 23.7302, lng: 90.4166 },
    ],
  });
  console.log(`✓ Created ${locations.count} locations`);

  // Fetch locations for reference
  const banani      = await prisma.location.findUnique({ where: { name: 'Banani' } });
  const mohakhali   = await prisma.location.findUnique({ where: { name: 'Mohakhali' } });
  const gulshan1    = await prisma.location.findUnique({ where: { name: 'Gulshan 1' } });
  const dhanmondi   = await prisma.location.findUnique({ where: { name: 'Dhanmondi' } });
  const farmgate    = await prisma.location.findUnique({ where: { name: 'Farmgate' } });

  if (!banani || !mohakhali || !gulshan1 || !dhanmondi || !farmgate) {
    throw new Error('Required locations not found after seeding');
  }

  // ─── Users ───
  const passwordHash = await bcrypt.hash('Tesla@2024', 12);

  // Driver: Jashim
  const jashim = await prisma.user.create({
    data: {
      name: 'Jashim Uddin',
      phone: '+8801711000001',
      email: 'jashim@dhakateslapool.com',
      passwordHash,
      role: UserRole.DRIVER,
    },
  });

  // Passengers
  const nusrat = await prisma.user.create({
    data: {
      name: 'Nusrat Jahan',
      phone: '+8801811000002',
      email: 'nusrat@example.com',
      passwordHash,
      role: UserRole.PASSENGER,
    },
  });

  const rafiq = await prisma.user.create({
    data: {
      name: 'Rafiq Islam',
      phone: '+8801911000003',
      email: 'rafiq@example.com',
      passwordHash,
      role: UserRole.PASSENGER,
    },
  });

  const shirin = await prisma.user.create({
    data: {
      name: 'Shirin Akter',
      phone: '+8801611000004',
      email: 'shirin@example.com',
      passwordHash,
      role: UserRole.PASSENGER,
    },
  });

  console.log('✓ Created users: Jashim, Nusrat, Rafiq, Shirin');

  // ─── Wallets (TeslaPay) ───
  await prisma.wallet.create({
    data: {
      userId: jashim.id,
      balancePaisa: 500000, // 5000 BDT
      transactions: {
        create: { amountPaisa: 500000, description: 'Initial wallet credit' },
      },
    },
  });

  await prisma.wallet.create({
    data: {
      userId: nusrat.id,
      balancePaisa: 100000, // 1000 BDT
      transactions: {
        create: { amountPaisa: 100000, description: 'Initial wallet credit' },
      },
    },
  });

  await prisma.wallet.create({
    data: {
      userId: rafiq.id,
      balancePaisa: 75000, // 750 BDT
      transactions: {
        create: { amountPaisa: 75000, description: 'Initial wallet credit' },
      },
    },
  });

  await prisma.wallet.create({
    data: {
      userId: shirin.id,
      balancePaisa: 50000, // 500 BDT
      transactions: {
        create: { amountPaisa: 50000, description: 'Initial wallet credit' },
      },
    },
  });

  console.log('✓ Created TeslaPay wallets');

  // ─── Tesla: Bullet ───
  const bullet = await prisma.tesla.create({
    data: {
      driverId: jashim.id,
      name: 'Bullet',
      licensePlate: 'DHAKA-TESLA-001',
      capacity: 3,
      status: TeslaStatus.ONLINE,
      currentLat: banani.lat,
      currentLng: banani.lng,
    },
  });

  console.log(`✓ Created Tesla "Bullet" (capacity: ${bullet.capacity} seats)`);

  // ─── Demo: Completed pool ride (Nusrat + Rafiq shared Bullet) ───
  // This is the story ride from the spec
  const demoPool = await prisma.pool.create({
    data: {
      teslaId: bullet.id,
      status: 'COMPLETED',
      seatsOccupied: 2,
      pickupZone: 'NORTH',
      startedAt: new Date('2024-01-15T08:41:00+06:00'),
      completedAt: new Date('2024-01-15T08:53:00+06:00'),
    },
  });

  // Nusrat's ride: Banani -> Mohakhali
  // Distance: ~1.8 km, fare = 3000 + 1800*3 - 800 = 7600 paisa = 76 BDT
  const nusratRide = await prisma.rideRequest.create({
    data: {
      passengerId: nusrat.id,
      poolId: demoPool.id,
      pickupLocationId: banani.id,
      destLocationId: mohakhali.id,
      seatsRequested: 1,
      status: 'COMPLETED',
      baseFarePaisa: 3000,        // 30 BDT base
      distanceChargePaisa: 5400,  // 1.8km * 30 paisa/10m = 5400
      poolDiscountPaisa: 800,     // 8 BDT pool discount
      totalFarePaisa: 7600,       // 76 BDT
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: 'PAID',
      matchedAt: new Date('2024-01-15T08:42:00+06:00'),
      arrivedAt: new Date('2024-01-15T08:46:00+06:00'),
      startedAt: new Date('2024-01-15T08:47:00+06:00'),
      completedAt: new Date('2024-01-15T08:53:00+06:00'),
    },
  });

  // Rafiq's ride: Banani -> Gulshan 1
  // Distance: ~1.1 km, fare = 3000 + 3300 - 800 = 5500 paisa = 55 BDT
  const rafiqRide = await prisma.rideRequest.create({
    data: {
      passengerId: rafiq.id,
      poolId: demoPool.id,
      pickupLocationId: banani.id,
      destLocationId: gulshan1.id,
      seatsRequested: 1,
      status: 'COMPLETED',
      baseFarePaisa: 3000,        // 30 BDT base
      distanceChargePaisa: 3300,  // 1.1km * 30 paisa/10m = 3300
      poolDiscountPaisa: 800,     // 8 BDT pool discount
      totalFarePaisa: 5500,       // 55 BDT
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: 'PAID',
      matchedAt: new Date('2024-01-15T08:44:00+06:00'),
      arrivedAt: new Date('2024-01-15T08:46:00+06:00'),
      startedAt: new Date('2024-01-15T08:47:00+06:00'),
      completedAt: new Date('2024-01-15T08:50:00+06:00'),
    },
  });

  // Status histories for demo rides
  await prisma.rideStatusHistory.createMany({
    data: [
      { rideRequestId: nusratRide.id, fromStatus: null, toStatus: 'REQUESTED', changedBy: nusrat.id, createdAt: new Date('2024-01-15T08:41:00+06:00') },
      { rideRequestId: nusratRide.id, fromStatus: 'REQUESTED', toStatus: 'MATCHED', changedBy: jashim.id, createdAt: new Date('2024-01-15T08:42:00+06:00') },
      { rideRequestId: nusratRide.id, fromStatus: 'MATCHED', toStatus: 'DRIVER_ARRIVED', changedBy: jashim.id, createdAt: new Date('2024-01-15T08:46:00+06:00') },
      { rideRequestId: nusratRide.id, fromStatus: 'DRIVER_ARRIVED', toStatus: 'STARTED', changedBy: jashim.id, createdAt: new Date('2024-01-15T08:47:00+06:00') },
      { rideRequestId: nusratRide.id, fromStatus: 'STARTED', toStatus: 'COMPLETED', changedBy: jashim.id, createdAt: new Date('2024-01-15T08:53:00+06:00') },
      { rideRequestId: rafiqRide.id, fromStatus: null, toStatus: 'REQUESTED', changedBy: rafiq.id, createdAt: new Date('2024-01-15T08:43:00+06:00') },
      { rideRequestId: rafiqRide.id, fromStatus: 'REQUESTED', toStatus: 'MATCHED', changedBy: jashim.id, createdAt: new Date('2024-01-15T08:44:00+06:00') },
      { rideRequestId: rafiqRide.id, fromStatus: 'MATCHED', toStatus: 'DRIVER_ARRIVED', changedBy: jashim.id, createdAt: new Date('2024-01-15T08:46:00+06:00') },
      { rideRequestId: rafiqRide.id, fromStatus: 'DRIVER_ARRIVED', toStatus: 'STARTED', changedBy: jashim.id, createdAt: new Date('2024-01-15T08:47:00+06:00') },
      { rideRequestId: rafiqRide.id, fromStatus: 'STARTED', toStatus: 'COMPLETED', changedBy: jashim.id, createdAt: new Date('2024-01-15T08:50:00+06:00') },
    ],
  });

  // Payments for demo rides
  await prisma.payment.createMany({
    data: [
      { rideRequestId: nusratRide.id, amountPaisa: 7600, method: PaymentMethod.CASH, status: 'PAID' },
      { rideRequestId: rafiqRide.id, amountPaisa: 5500, method: PaymentMethod.CASH, status: 'PAID' },
    ],
  });

  console.log('✓ Created demo completed pool ride (Nusrat + Rafiq shared Bullet)');
  console.log('  → Nusrat: Banani→Mohakhali, fare: 76 BDT (76.00 BDT = 7600 paisa)');
  console.log('  → Rafiq:  Banani→Gulshan 1, fare: 55 BDT (55.00 BDT = 5500 paisa)');

  // ─── Summary ───
  console.log('\n✅ Database seeded successfully!\n');
  console.log('Demo credentials (all share same password):');
  console.log('  Password: Tesla@2024');
  console.log('  ─────────────────────────────');
  console.log('  Driver:     jashim@dhakateslapool.com  (Jashim Uddin)');
  console.log('  Passenger:  nusrat@example.com         (Nusrat Jahan)');
  console.log('  Passenger:  rafiq@example.com          (Rafiq Islam)');
  console.log('  Passenger:  shirin@example.com         (Shirin Akter)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
