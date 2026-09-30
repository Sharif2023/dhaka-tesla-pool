'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import SidebarLayout from '@/components/SidebarLayout';
import Link from 'next/link';
import { rideApi, RideRequest } from '@/lib/api';
import toast from 'react-hot-toast';
import { MapPin, Clock, Zap, ArrowRight, Car, Home, CheckCircle, XCircle, Loader, Handshake, Navigation, Sparkles } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'var(--color-warning)', MATCHED: 'var(--color-text)', DRIVER_ARRIVED: 'var(--color-muted)',
  STARTED: 'var(--color-text)', COMPLETED: 'var(--color-success)', CANCELLED: 'var(--color-danger)',
};

const STATUS_LABELS: Record<string, React.ReactNode> = {
  REQUESTED: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Loader size={14} className="animate-spin" /> Waiting for driver</span>,
  MATCHED: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Handshake size={14} /> Driver accepted</span>,
  DRIVER_ARRIVED: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> Driver arrived</span>,
  STARTED: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Navigation size={14} /> On the way</span>,
  COMPLETED: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Completed</span>,
  CANCELLED: <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> Cancelled</span>,
};

function RideCard({ ride, onCancel }: { ride: RideRequest; onCancel: (id: string) => void }) {
  const isActive = ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'].includes(ride.status);
  const totalBDT = ride.totalFarePaisa ? (ride.totalFarePaisa / 100).toFixed(2) : '—';
  const isPooled = ride.poolDiscountPaisa && ride.poolDiscountPaisa > 0;

  return (
    <div className="card animate-fade-in" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: STATUS_COLORS[ride.status] || '#64748b',
                display: 'inline-block',
                ...(isActive ? { animation: 'pulse-glow 2s infinite' } : {}),
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: 600, color: STATUS_COLORS[ride.status] }}>
              {STATUS_LABELS[ride.status] || ride.status}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {new Date(ride.createdAt).toLocaleDateString('en-BD', { dateStyle: 'medium' })} at{' '}
            {new Date(ride.createdAt).toLocaleTimeString('en-BD', { timeStyle: 'short' })}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)' }}>৳{totalBDT}</div>
          {isPooled && (
            <span className="badge" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
              <Sparkles size={10} /> Pooled ride
            </span>
          )}
        </div>
      </div>

      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ flex: 1, background: 'var(--color-surface2)', borderRadius: '10px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>PICKUP</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>{ride.pickupLocation.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{ride.pickupLocation.zone} zone</div>
        </div>
        <ArrowRight size={16} color="var(--color-muted)" />
        <div style={{ flex: 1, background: 'var(--color-surface2)', borderRadius: '10px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <MapPin size={8} color="var(--color-danger)" />
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>DROP-OFF</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>{ride.destLocation.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{ride.destLocation.zone} zone</div>
        </div>
      </div>

      {/* Fare breakdown */}
      {ride.baseFarePaisa && (
        <div style={{ background: 'var(--color-surface2)', borderRadius: '10px', padding: '12px', marginBottom: '12px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--color-muted)' }}>Base fare</span>
            <span>৳{(ride.baseFarePaisa / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--color-muted)' }}>Distance charge</span>
            <span>৳{((ride.distanceChargePaisa || 0) / 100).toFixed(2)}</span>
          </div>
          {isPooled && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-success)' }}>
              <span>Pool discount</span>
              <span>-৳{((ride.poolDiscountPaisa || 0) / 100).toFixed(2)}</span>
            </div>
          )}
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: 'var(--color-success)' }}>৳{totalBDT}</span>
          </div>
        </div>
      )}

      {/* Driver info */}
      {ride.pool?.tesla && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', color: '#94a3b8' }}>
          <Car size={14} />
          <span>{ride.pool.tesla.name} ({ride.pool.tesla.licensePlate})</span>
          {ride.pool.tesla.driver && <span>— {ride.pool.tesla.driver.name}</span>}
        </div>
      )}

      {/* Cancel button */}
      {isActive && ride.status !== 'STARTED' && (
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onCancel(ride.id)}
        >
          Cancel Ride
        </button>
      )}
    </div>
  );
}

export default function PassengerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [recentRides, setRecentRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'PASSENGER') { router.push('/driver'); return; }
    loadRides();
    const interval = setInterval(loadRides, 8000); // Poll for updates
    return () => clearInterval(interval);
  }, [user]);

  const loadRides = async () => {
    try {
      const res = await rideApi.getMyRides();
      const rides = res.data.rides;
      const active = rides.find(r => ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'].includes(r.status));
      setActiveRide(active || null);
      setRecentRides(rides.slice(0, 5));
      setLoading(false);
    } catch { setLoading(false); }
  };

  const handleCancel = async (id: string) => {
    try {
      await rideApi.cancel(id, 'Passenger cancelled');
      toast.success('Ride cancelled');
      loadRides();
    } catch (err) {
      toast.error('Could not cancel ride');
    }
  };

  const navItems = [
    { href: '/passenger', label: 'Dashboard', icon: <Home size={16} /> },
    { href: '/passenger/book', label: 'Book Ride', icon: <Zap size={16} /> },
    { href: '/passenger/rides', label: 'My Rides', icon: <Clock size={16} /> },
  ];

  return (
    <SidebarLayout navItems={navItems} role="PASSENGER">
      <div style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>
            Good day, {user?.name?.split(' ')[0]}!
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>Ready to pool a ride through Dhaka?</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
            <p style={{ marginTop: '16px' }}>Loading your rides...</p>
          </div>
        ) : (
          <>
            {/* Active Ride */}
            {activeRide ? (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active Ride
                </h2>
                <RideCard ride={activeRide} onCancel={handleCancel} />
              </div>
            ) : (
              <div style={{ marginBottom: '32px' }}>
                <div className="glass" style={{ padding: '32px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><Zap size={48} color="var(--color-text)" /></div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No active ride</h2>
                  <p style={{ color: '#64748b', marginBottom: '20px' }}>Book a Tesla pool ride through Dhaka</p>
                  <Link href="/passenger/book">
                    <button className="btn btn-primary btn-lg">
                      <Zap size={16} />
                      Book a Ride
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Recent rides */}
            {recentRides.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Recent Rides
                  </h2>
                  <Link href="/passenger/rides" style={{ fontSize: '13px', color: 'var(--color-text)', textDecoration: 'none' }}>
                    View all →
                  </Link>
                </div>
                {recentRides.filter(r => !activeRide || r.id !== activeRide.id).slice(0, 3).map(ride => (
                  <RideCard key={ride.id} ride={ride} onCancel={handleCancel} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
