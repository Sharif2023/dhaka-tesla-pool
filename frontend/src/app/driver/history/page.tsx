'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import SidebarLayout from '@/components/SidebarLayout';
import { driverApi, Pool } from '@/lib/api';
import { Car, History, ArrowRight, Users, Wallet, FolderOpen } from 'lucide-react';

export default function DriverHistoryPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'DRIVER') { router.push('/auth/login'); return; }
    driverApi.getHistory()
      .then(res => { setPools(res.data.pools); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  const navItems = [
    { href: '/driver', label: 'Dashboard', icon: <Car size={16} /> },
    { href: '/driver/history', label: 'Trip History', icon: <History size={16} /> },
  ];

  const totalEarnings = pools.reduce((sum, p) =>
    sum + (p.rideRequests?.reduce((s, r) => s + (r.totalFarePaisa || 0), 0) || 0), 0);

  return (
    <SidebarLayout navItems={navItems} role="DRIVER">
      <div style={{ maxWidth: '880px', width: '100%' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px', height: '44px',
              borderRadius: '12px',
              background: 'var(--color-surface2)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <History size={22} color="var(--color-text)" />
            </div>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Trip History
              </h1>
              <p style={{ color: 'var(--color-muted)', fontSize: '13px', marginTop: '3px', margin: 0 }}>
                {pools.length} completed trips • Banani Zone
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Trips', value: pools.length, icon: <Car size={24} color="var(--color-text)" /> },
            { label: 'Passengers Served', value: pools.reduce((s, p) => s + (p.rideRequests?.length || 0), 0), icon: <Users size={24} color="var(--color-text)" /> },
            { label: 'Total Earnings', value: `৳${(totalEarnings / 100).toFixed(2)}`, icon: <Wallet size={24} color="var(--color-text)" /> },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
              <div className="stat-value" style={{ fontSize: '24px' }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
          </div>
        ) : pools.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><FolderOpen size={48} color="var(--color-muted)" /></div>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>No trips yet</h3>
            <p>Complete your first trip to see history here</p>
          </div>
        ) : (
          pools.map(pool => {
            const riders = pool.rideRequests || [];
            const poolTotal = riders.reduce((s, r) => s + (r.totalFarePaisa || 0), 0);

            return (
              <div key={pool.id} className="card animate-fade-in" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                      {pool.pickupZone} Zone Pool
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      {pool.completedAt ? new Date(pool.completedAt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-success)' }}>
                      ৳{(poolTotal / 100).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      <Users size={10} style={{ display: 'inline', marginRight: '4px' }} />
                      {riders.length} passenger{riders.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {riders.map(ride => (
                  <div key={ride.id} style={{ background: 'var(--color-surface2)', borderRadius: '8px', padding: '10px', marginBottom: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>
                        {(ride as unknown as { passenger?: { name: string } }).passenger?.name}
                      </span>
                      <span style={{ color: 'var(--color-muted)' }}>•</span>
                      <span>{ride.pickupLocation?.name}</span>
                      <ArrowRight size={10} color="var(--color-muted)" />
                      <span>{ride.destLocation?.name}</span>
                    </div>
                    <div style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                      ৳{ride.totalFarePaisa ? (ride.totalFarePaisa / 100).toFixed(2) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </SidebarLayout>
  );
}
