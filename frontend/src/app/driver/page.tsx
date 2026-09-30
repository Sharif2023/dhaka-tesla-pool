'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import SidebarLayout from '@/components/SidebarLayout';
import { driverApi, type DriverDashboard, type Pool, type RideRequest } from '@/lib/api';
import toast from 'react-hot-toast';
import { Power, Users, ArrowRight, Clock, History, CheckCircle, Car } from 'lucide-react';

type DriverAction = 'arrive' | 'start' | 'complete';

const ACTION_CONFIG: Record<string, { label: string; action: DriverAction; color: string; next: string }> = {
  LOCKED:      { label: '📍 Mark Arrived', action: 'arrive',   color: '#8b5cf6', next: 'DRIVER_ARRIVED' },
  DRIVER_ARRIVED: { label: '🚗 Start Trip',  action: 'start',    color: '#06b6d4', next: 'STARTED' },
  IN_PROGRESS:    { label: '✅ Complete Trip', action: 'complete', color: '#10b981', next: 'COMPLETED' },
};

function PoolCard({ pool, onAction, onAccept }: {
  pool: Pool;
  onAction: (poolId: string, action: DriverAction) => void;
  onAccept: (poolId: string) => void;
}) {
  const actionConfig = ACTION_CONFIG[pool.status];
  const riders = pool.rideRequests?.filter(r => r.status !== 'CANCELLED') || [];

  return (
    <div className="card animate-fade-in" style={{ marginBottom: '16px' }}>
      {/* Pool header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
            Pool — {pool.pickupZone} Zone
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {riders.length} passenger{riders.length !== 1 ? 's' : ''} • {pool.seatsOccupied} seats
          </div>
        </div>
        <span className={`badge badge-${pool.status === 'OPEN' ? 'requested' : pool.status === 'LOCKED' ? 'matched' : pool.status === 'IN_PROGRESS' ? 'started' : 'completed'}`}>
          {pool.status}
        </span>
      </div>

      {/* Passengers */}
      <div style={{ marginBottom: '16px' }}>
        {riders.map((ride: RideRequest) => (
          <div key={ride.id} style={{
            background: '#1a2236',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                  {(ride as RideRequest & { passenger?: { name: string } }).passenger?.name || 'Passenger'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <span style={{ color: '#10b981' }}>{ride.pickupLocation?.name}</span>
                  <ArrowRight size={12} color="#64748b" />
                  <span style={{ color: '#ef4444' }}>{ride.destLocation?.name}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {ride.seatsRequested} seat • {ride.paymentMethod}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#10b981' }}>
                  ৳{ride.totalFarePaisa ? (ride.totalFarePaisa / 100).toFixed(2) : '—'}
                </div>
                <span className={`badge badge-${ride.status.toLowerCase().replace('_', '-')}`} style={{ fontSize: '10px', marginTop: '4px' }}>
                  {ride.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {pool.status === 'OPEN' && (
        <button
          className="btn btn-primary btn-full"
          onClick={() => onAccept(pool.id)}
        >
          <CheckCircle size={16} /> Accept Pool
        </button>
      )}

      {actionConfig && (
        <button
          className="btn btn-full"
          style={{ background: actionConfig.color, color: 'white', boxShadow: `0 4px 15px ${actionConfig.color}44` }}
          onClick={() => onAction(pool.id, actionConfig.action)}
        >
          {actionConfig.label}
        </button>
      )}
    </div>
  );
}

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DriverDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'DRIVER') { router.push('/passenger'); return; }
    loadDashboard();
    const interval = setInterval(loadDashboard, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await driverApi.getRequests();
      setDashboard(res.data);
      setLoading(false);
    } catch { setLoading(false); }
  }, []);

  const toggleStatus = async () => {
    if (!dashboard) return;
    const isOnline = dashboard.tesla.status === 'ONLINE' || dashboard.tesla.status === 'ON_TRIP';
    try {
      if (isOnline) {
        await driverApi.goOffline();
        toast.success('You are now OFFLINE');
      } else {
        await driverApi.goOnline();
        toast.success('You are now ONLINE ⚡');
      }
      loadDashboard();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleAccept = async (poolId: string) => {
    try {
      await driverApi.acceptPool(poolId);
      toast.success('Pool accepted! Passengers notified 🎉');
      loadDashboard();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept pool');
    }
  };

  const handleAction = async (poolId: string, action: DriverAction) => {
    try {
      await driverApi.updateStatus(poolId, action);
      const msgs: Record<DriverAction, string> = {
        arrive: '📍 Arrival marked! Passengers notified.',
        start: '🚗 Trip started! Drive safe.',
        complete: '✅ Trip completed! Great job.',
      };
      toast.success(msgs[action]);
      loadDashboard();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const navItems = [
    { href: '/driver', label: 'Dashboard', icon: <Car size={16} /> },
    { href: '/driver/history', label: 'Trip History', icon: <History size={16} /> },
  ];

  const tesla = dashboard?.tesla;
  const activePools = dashboard?.activePools || [];
  const isOnline = tesla?.status === 'ONLINE' || tesla?.status === 'ON_TRIP';

  return (
    <SidebarLayout navItems={navItems} role="DRIVER">
      <div style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>
            Driver Dashboard
          </h1>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            Welcome, {user?.name?.split(' ')[0]}! 🚗
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
          </div>
        ) : (
          <>
            {/* Tesla status card */}
            {tesla && (
              <div className="card" style={{ marginBottom: '24px', border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : '#1f2d4a'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{
                        width: '48px', height: '48px',
                        background: 'linear-gradient(135deg, #1a2236, #0d1b3e)',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px',
                      }}>⚡</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '20px' }}>{tesla.name}</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>{tesla.licensePlate}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge badge-${tesla.status.toLowerCase().replace('_', '-')}`}>
                        {tesla.status}
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        <Users size={12} style={{ display: 'inline' }} /> {tesla.capacity} seats
                      </span>
                    </div>
                  </div>
                  <button
                    className={`btn ${isOnline ? 'btn-danger' : 'btn-success'}`}
                    onClick={toggleStatus}
                    disabled={tesla.status === 'ON_TRIP'}
                    style={{ gap: '8px' }}
                  >
                    <Power size={16} />
                    {tesla.status === 'ON_TRIP' ? 'On Trip' : isOnline ? 'Go Offline' : 'Go Online'}
                  </button>
                </div>
              </div>
            )}

            {/* Active Pools */}
            {!isOnline && activePools.length === 0 ? (
              <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💤</div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>You&apos;re Offline</h2>
                <p style={{ color: '#64748b', marginBottom: '20px' }}>Go online to start accepting rides</p>
                <button className="btn btn-success btn-lg" onClick={toggleStatus}>
                  <Power size={16} /> Go Online
                </button>
              </div>
            ) : activePools.length === 0 ? (
              <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Active Pools</h2>
                <p style={{ color: '#64748b' }}>Passengers are booking — pools will appear here</p>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                  Active Pools ({activePools.length})
                </h2>
                {activePools.map((pool: Pool) => (
                  <PoolCard
                    key={pool.id}
                    pool={pool}
                    onAction={handleAction}
                    onAccept={handleAccept}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
