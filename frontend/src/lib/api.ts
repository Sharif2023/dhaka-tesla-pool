/**
 * Dhaka Tesla Pool - API Client
 * Centralized API calls to the backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('dtp_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.message || 'Request failed');
  }

  return data;
}

// ─── Auth ───
export const authApi = {
  register: (body: { name: string; phone: string; email?: string; password: string; role: string }) =>
    fetchApi<{ success: boolean; data: { user: User; token: string } }>('/auth/register', {
      method: 'POST', body: JSON.stringify(body),
    }),

  login: (phone: string, password: string) =>
    fetchApi<{ success: boolean; data: { user: User; token: string } }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ phone, password }),
    }),

  getMe: () =>
    fetchApi<{ success: boolean; data: { user: User } }>('/auth/me'),
};

// ─── Locations ───
export const locationApi = {
  getAll: () =>
    fetchApi<{ success: boolean; data: { locations: Location[] } }>('/locations'),
};

// ─── Rides ───
export const rideApi = {
  estimate: (pickupLocationId: string, destLocationId: string) =>
    fetchApi<{ success: boolean; data: FareEstimate }>(`/rides/estimate?pickupLocationId=${pickupLocationId}&destLocationId=${destLocationId}`),

  request: (body: { pickupLocationId: string; destLocationId: string; seatsRequested: number; paymentMethod?: string; notes?: string }) =>
    fetchApi<{ success: boolean; data: { ride: RideRequest; isPooled: boolean; fareBreakdown: FareBreakdown } }>('/rides', {
      method: 'POST', body: JSON.stringify(body),
    }),

  getMyRides: (status?: string) =>
    fetchApi<{ success: boolean; data: { rides: RideRequest[]; total: number } }>(`/rides${status ? `?status=${status}` : ''}`),

  getById: (id: string) =>
    fetchApi<{ success: boolean; data: { ride: RideRequest } }>(`/rides/${id}`),

  cancel: (id: string, reason?: string) =>
    fetchApi<{ success: boolean; message: string }>(`/rides/${id}/cancel`, {
      method: 'PATCH', body: JSON.stringify({ reason }),
    }),
};

// ─── Driver ───
export const driverApi = {
  goOnline: () =>
    fetchApi<{ success: boolean; data: { status: string } }>('/driver/online', { method: 'POST' }),

  goOffline: () =>
    fetchApi<{ success: boolean; data: { status: string } }>('/driver/offline', { method: 'POST' }),

  getRequests: () =>
    fetchApi<{ success: boolean; data: DriverDashboard }>('/driver/requests'),

  acceptPool: (poolId: string) =>
    fetchApi<{ success: boolean; message: string }>(`/driver/pool/${poolId}/accept`, { method: 'POST' }),

  updateStatus: (poolId: string, action: 'arrive' | 'start' | 'complete') =>
    fetchApi<{ success: boolean; message: string }>(`/driver/pool/${poolId}/${action}`, { method: 'PATCH' }),

  getHistory: () =>
    fetchApi<{ success: boolean; data: { tesla: Tesla; pools: Pool[] } }>('/driver/history'),
};

// ─── User ───
export const userApi = {
  getProfile: () =>
    fetchApi<{ success: boolean; data: { user: User } }>('/users/profile'),

  getWallet: () =>
    fetchApi<{ success: boolean; data: { wallet: Wallet } }>('/users/wallet'),
};

// ─── Types ───
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'PASSENGER' | 'DRIVER';
  createdAt: string;
  wallet?: { balancePaisa: number };
  teslas?: Tesla[];
}

export interface Location {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
}

export interface Tesla {
  id: string;
  name: string;
  licensePlate: string;
  capacity: number;
  status: 'OFFLINE' | 'ONLINE' | 'ON_TRIP';
  driver?: { name: string; phone: string };
}

export interface Pool {
  id: string;
  teslaId: string;
  status: 'OPEN' | 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  seatsOccupied: number;
  pickupZone: string;
  tesla?: Tesla;
  rideRequests?: RideRequest[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RideRequest {
  id: string;
  passengerId: string;
  poolId?: string;
  status: 'REQUESTED' | 'MATCHED' | 'DRIVER_ARRIVED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  seatsRequested: number;
  baseFarePaisa?: number;
  distanceChargePaisa?: number;
  poolDiscountPaisa?: number;
  totalFarePaisa?: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  cancellationReason?: string;
  pickupLocation: Location;
  destLocation: Location;
  pool?: Pool;
  statusHistory?: StatusEvent[];
  payment?: Payment;
  createdAt: string;
  matchedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface StatusEvent {
  id: string;
  fromStatus?: string;
  toStatus: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  amountPaisa: number;
  method: string;
  status: string;
}

export interface FareEstimate {
  pickup: { id: string; name: string };
  destination: { id: string; name: string };
  distanceMeters: number;
  soloFare: { totalBDT: string; breakdown: FareBreakdown };
  poolFare: { totalBDT: string; breakdown: FareBreakdown };
}

export interface FareBreakdown {
  baseFareBDT: string;
  distanceChargeBDT: string;
  poolDiscountBDT: string;
  totalFareBDT?: string;
}

export interface Wallet {
  id: string;
  balancePaisa: number;
  balanceBDT: string;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  amountPaisa: number;
  description: string;
  createdAt: string;
}

export interface DriverDashboard {
  tesla: Tesla;
  activePools: Pool[];
  pendingRequests: RideRequest[];
}

export { ApiError };
