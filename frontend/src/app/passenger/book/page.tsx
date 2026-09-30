'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { locationApi, rideApi, Location, FareEstimate } from '@/lib/api';
import toast from 'react-hot-toast';
import { Zap, Clock, MapPin, ArrowRight, Loader, Home, Wallet, Banknote, Sparkles } from 'lucide-react';

export default function BookRidePage() {
  const { user, isReady } = useAuthGuard('PASSENGER');
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({ pickupId: '', destId: '', seats: 1, payment: 'CASH', notes: '' });
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    locationApi.getAll().then(res => setLocations(res.data.locations));
  }, [isReady]);

  useEffect(() => {
    if (form.pickupId && form.destId && form.pickupId !== form.destId) {
      const timer = setTimeout(async () => {
        setEstimating(true);
        try {
          const res = await rideApi.estimate(form.pickupId, form.destId);
          setEstimate(res.data);
        } catch { setEstimate(null); }
        setEstimating(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setEstimate(null);
    }
  }, [form.pickupId, form.destId]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pickupId || !form.destId) { toast.error('Please select pickup and destination'); return; }
    setLoading(true);
    try {
      const res = await rideApi.request({
        pickupLocationId: form.pickupId,
        destLocationId: form.destId,
        seatsRequested: form.seats,
        paymentMethod: form.payment,
        notes: form.notes,
      });
      setBooked(true);
      const isPooled = res.data.isPooled;
      toast.success(isPooled ? 'Matched to existing pool! Share the fare.' : 'Ride requested! Waiting for driver.');
      setTimeout(() => router.push('/passenger'), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to book ride';
      toast.error(message);
      setLoading(false);
    }
  };

  const navItems = [
    { href: '/passenger', label: 'Dashboard', icon: <Home size={16} /> },
    { href: '/passenger/book', label: 'Book Ride', icon: <Zap size={16} /> },
    { href: '/passenger/rides', label: 'My Rides', icon: <Clock size={16} /> },
  ];

  const byZone = locations.reduce<Record<string, Location[]>>((acc, loc) => {
    (acc[loc.zone] = acc[loc.zone] || []).push(loc);
    return acc;
  }, {});

  if (!isReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    );
  }

  if (booked) {
    return (
      <SidebarLayout navItems={navItems} role="PASSENGER">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><Zap size={64} color="var(--color-text)" /></div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Ride Booked!</h2>
          <p style={{ color: 'var(--color-muted)' }}>Redirecting to your dashboard...</p>
          <span className="spinner" style={{ marginTop: '20px', width: '24px', height: '24px' }} />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout navItems={navItems} role="PASSENGER">
      <div style={{ maxWidth: '820px', width: '100%' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Book a Ride</h1>
          <p style={{ color: 'var(--color-muted)', marginTop: '4px' }}>Get matched with a Tesla pool or ride solo</p>
        </div>

        <form onSubmit={handleBook}>
          <div className="card" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} /> Where are you going?
            </h2>

            <div className="form-group">
              <label className="label">Pickup Location</label>
              <select
                id="pickup"
                className="select"
                value={form.pickupId}
                onChange={e => setForm(p => ({ ...p, pickupId: e.target.value }))}
                required
              >
                <option value="">Select pickup area...</option>
                {Object.entries(byZone).map(([zone, locs]) => (
                  <optgroup key={zone} label={`${zone} Zone`}>
                    {locs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
              <ArrowRight size={20} color="var(--color-muted)" style={{ transform: 'rotate(90deg)' }} />
            </div>

            <div className="form-group">
              <label className="label">Destination</label>
              <select
                id="destination"
                className="select"
                value={form.destId}
                onChange={e => setForm(p => ({ ...p, destId: e.target.value }))}
                required
              >
                <option value="">Select destination area...</option>
                {Object.entries(byZone).map(([zone, locs]) => (
                  <optgroup key={zone} label={`${zone} Zone`}>
                    {locs.filter(l => l.id !== form.pickupId).map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="label">Seats needed</label>
                <select
                  id="seats"
                  className="select"
                  value={form.seats}
                  onChange={e => setForm(p => ({ ...p, seats: parseInt(e.target.value) }))}
                >
                  <option value={1}>1 seat</option>
                  <option value={2}>2 seats</option>
                  <option value={3}>3 seats</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Payment method</label>
                <select
                  id="payment"
                  className="select"
                  value={form.payment}
                  onChange={e => setForm(p => ({ ...p, payment: e.target.value }))}
                >
                  <option value="CASH">Cash</option>
                  <option value="TESLA_PAY">TeslaPay</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Notes (optional)</label>
              <input
                id="notes"
                className="input"
                type="text"
                placeholder="Any special instructions..."
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                maxLength={200}
              />
            </div>
          </div>

          {/* Fare estimate */}
          {(estimating || estimate) && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} /> Fare Estimate
              </h2>
              {estimating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-muted)' }}>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Calculating fare...
                </div>
              ) : estimate ? (
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '12px' }}>
                    Distance: ~{(estimate.distanceMeters / 1000).toFixed(1)} km
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Solo */}
                    <div style={{ background: 'var(--color-surface2)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Solo ride</div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text)' }}>
                        ৳{estimate.soloFare.totalBDT}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '8px' }}>
                        Base: ৳{estimate.soloFare.breakdown.baseFareBDT} + Dist: ৳{estimate.soloFare.breakdown.distanceChargeBDT}
                      </div>
                    </div>
                    {/* Pool */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-success)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} /> Pooled
                      </div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-success)' }}>
                        ৳{estimate.poolFare.totalBDT}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '8px' }}>
                        Save ৳{estimate.poolFare.breakdown.poolDiscountBDT} with pool
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '12px' }}>
                    * Pool discount applied if matched with another passenger in same zone
                  </p>
                </div>
              ) : null}
            </div>
          )}

          <button
            id="book-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading || !form.pickupId || !form.destId}
          >
            {loading ? <><span className="spinner" /> Booking...</> : <><Zap size={16} /> Book Tesla Pool</>}
          </button>
        </form>
      </div>
    </SidebarLayout>
  );
}
