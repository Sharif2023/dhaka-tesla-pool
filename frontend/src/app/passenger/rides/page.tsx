'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import SidebarLayout from '@/components/SidebarLayout';
import { rideApi, RideRequest } from '@/lib/api';
import toast from 'react-hot-toast';
import { Zap, Clock, ArrowRight, Filter, Home, Car } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Waiting', MATCHED: 'Matched', DRIVER_ARRIVED: 'Arrived',
  STARTED: 'In Progress', COMPLETED: 'Done', CANCELLED: 'Cancelled',
};

const STATUS_BADGE: Record<string, string> = {
  REQUESTED: 'badge-requested', MATCHED: 'badge-matched', DRIVER_ARRIVED: 'badge-arrived',
  STARTED: 'badge-started', COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled',
};

export default function MyRidesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'PASSENGER') { router.push('/auth/login'); return; }
    loadRides();
  }, [user, filter]);

  const loadRides = async () => {
    setLoading(true);
    try {
      const res = await rideApi.getMyRides(filter || undefined);
      setRides(res.data.rides);
    } catch { toast.error('Failed to load rides'); }
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    try {
      await rideApi.cancel(id, 'Passenger cancelled');
      toast.success('Ride cancelled');
      loadRides();
    } catch { toast.error('Could not cancel ride'); }
  };

  const navItems = [
    { href: '/passenger', label: 'Dashboard', icon: <Home size={16} /> },
    { href: '/passenger/book', label: 'Book Ride', icon: <Zap size={16} /> },
    { href: '/passenger/rides', label: 'My Rides', icon: <Clock size={16} /> },
  ];

  return (
    <SidebarLayout navItems={navItems} role="PASSENGER">
      <div style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800 }}>My Rides</h1>
            <p style={{ color: 'var(--color-muted)', marginTop: '4px' }}>{rides.length} trips found</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--color-muted)" />
            <select
              className="select"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">All status</option>
              <option value="REQUESTED">Waiting</option>
              <option value="MATCHED">Matched</option>
              <option value="STARTED">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-muted)' }}>
            <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
          </div>
        ) : rides.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><Car size={48} color="var(--color-muted)" /></div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No rides yet</h3>
            <p style={{ marginBottom: '20px' }}>Book your first Tesla pool ride!</p>
            <button className="btn btn-primary" onClick={() => router.push('/passenger/book')}>
              <Zap size={14} /> Book a Ride
            </button>
          </div>
        ) : (
          rides.map(ride => (
            <div key={ride.id} className="card animate-fade-in" style={{ marginBottom: '12px' }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span className={`badge ${STATUS_BADGE[ride.status] || 'badge-requested'}`}>
                    {STATUS_LABELS[ride.status]}
                  </span>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '6px' }}>
                    {new Date(ride.createdAt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-success)' }}>
                    ৳{ride.totalFarePaisa ? (ride.totalFarePaisa / 100).toFixed(2) : '—'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{ride.paymentMethod}</div>
                </div>
              </div>

              {/* Route */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <span style={{ fontWeight: 600 }}>{ride.pickupLocation.name}</span>
                <ArrowRight size={14} color="var(--color-muted)" />
                <span style={{ fontWeight: 600 }}>{ride.destLocation.name}</span>
                {ride.poolDiscountPaisa && ride.poolDiscountPaisa > 0 && (
                  <span className="badge badge-matched" style={{ fontSize: '10px' }}>Pooled</span>
                )}
              </div>

              {/* Driver */}
              {ride.pool?.tesla && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Car size={12} /> {ride.pool.tesla.name} • {ride.pool.tesla.driver?.name}
                </div>
              )}

              {/* Status history */}
              {ride.statusHistory && ride.statusHistory.length > 0 && (
                <details style={{ marginTop: '12px' }}>
                  <summary style={{ fontSize: '12px', color: 'var(--color-text)', cursor: 'pointer' }}>View timeline</summary>
                  <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid var(--color-border)' }}>
                    {ride.statusHistory.map((h, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', padding: '4px 0', fontSize: '12px' }}>
                        <span style={{ color: 'var(--color-muted)', minWidth: '120px' }}>
                          {new Date(h.createdAt).toLocaleTimeString('en-BD', { timeStyle: 'short' })}
                        </span>
                        <span>{h.fromStatus ? `${h.fromStatus} →` : '→'} <strong>{h.toStatus}</strong></span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Cancel */}
              {['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED'].includes(ride.status) && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleCancel(ride.id)}
                  style={{ marginTop: '12px' }}
                >
                  Cancel
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </SidebarLayout>
  );
}
