// Haversine formula to calculate distance between two lat/lng points
export function calculateDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Fare Model (documented and hand-testable):
 *
 * passengerFare = baseFare + distanceCharge - poolDiscount
 *
 * - baseFare:       3000 paisa (30 BDT) — flat pickup cost
 * - distanceCharge: distanceMeters * 3 paisa/meter (= 30 BDT/km)
 * - poolDiscount:   800 paisa (8 BDT) if ride is pooled with another passenger
 *
 * Money: stored as INTEGER in paisa to avoid floating-point errors.
 * 1 BDT = 100 paisa. Display to user divides by 100.
 *
 * Example (hand-verifiable):
 *   Nusrat: Banani→Mohakhali ≈ 1800m
 *     distanceCharge = 1800 * 3 = 5400 paisa
 *     fare = 3000 + 5400 - 800 = 7600 paisa = 76.00 BDT ✓
 *
 *   Rafiq: Banani→Gulshan 1 ≈ 1100m
 *     distanceCharge = 1100 * 3 = 3300 paisa
 *     fare = 3000 + 3300 - 800 = 5500 paisa = 55.00 BDT ✓
 */
export function calculateFare(params: {
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  isPool: boolean;
  baseFarePaisa?: number;
  perMeterChargePaisa?: number;
  poolDiscountPaisa?: number;
}): {
  baseFarePaisa: number;
  distanceChargePaisa: number;
  poolDiscountPaisa: number;
  totalFarePaisa: number;
  distanceMeters: number;
} {
  const {
    pickupLat, pickupLng, destLat, destLng, isPool,
    baseFarePaisa = 3000,
    perMeterChargePaisa = 3,
    poolDiscountPaisa = 800,
  } = params;

  const distanceMeters = Math.round(calculateDistanceMeters(pickupLat, pickupLng, destLat, destLng));
  const distanceChargePaisa = distanceMeters * perMeterChargePaisa;
  const discount = isPool ? poolDiscountPaisa : 0;
  const totalFarePaisa = Math.max(baseFarePaisa, baseFarePaisa + distanceChargePaisa - discount);

  return {
    baseFarePaisa,
    distanceChargePaisa,
    poolDiscountPaisa: discount,
    totalFarePaisa,
    distanceMeters,
  };
}

// Convert paisa to BDT display string
export function paisaToBDT(paisa: number): string {
  return `${(paisa / 100).toFixed(2)} BDT`;
}
