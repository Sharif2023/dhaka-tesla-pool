'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { UserPlus, User, Car, Zap } from 'lucide-react';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'PASSENGER' });
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dhaka-tesla-pool-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.user?.role) {
          router.replace(parsed.state.user.role === 'DRIVER' ? '/driver' : '/passenger');
        }
      }
    } catch {}
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clean and normalize phone number
    let cleanedPhone = form.phone.trim().replace(/[\s\-()]/g, '');
    if (cleanedPhone.startsWith('01')) {
      cleanedPhone = '+8801' + cleanedPhone.slice(2);
    } else if (cleanedPhone.startsWith('8801')) {
      cleanedPhone = '+' + cleanedPhone;
    }

    if (!/^\+8801[3-9]\d{8}$/.test(cleanedPhone)) {
      toast.error('Valid Bangladeshi phone required (e.g. 017XXXXXXXX or +8801XXXXXXXXX)');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const cleanedEmail = form.email.trim();

    try {
      await register({
        name: form.name.trim(),
        phone: cleanedPhone,
        email: cleanedEmail || undefined,
        password: form.password,
        role: form.role,
      });
      const user = useAuthStore.getState().user;
      toast.success(`Welcome to Dhaka Tesla Pool, ${user?.name}!`);
      router.push(form.role === 'DRIVER' ? '/driver' : '/passenger');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registration failed';
      toast.error(message);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <Zap size={40} color="var(--color-text)" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px', marginBottom: '8px' }}>Join the Pool</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>Create your Dhaka Tesla Pool account</p>
        </div>

        <div className="glass" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">I am a...</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { value: 'PASSENGER', icon: <User size={16}/>, label: 'Passenger', desc: 'Book rides' },
                  { value: 'DRIVER', icon: <Car size={16}/>, label: 'Driver', desc: 'Drive a Tesla' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => update('role', r.value)}
                    style={{
                      padding: '14px',
                      border: `2px solid ${form.role === r.value ? 'var(--color-text)' : 'var(--color-border)'}`,
                      borderRadius: '10px',
                      background: form.role === r.value ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      color: form.role === r.value ? 'var(--color-text)' : 'var(--color-muted)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {r.icon} {r.label}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '2px' }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Full Name</label>
              <input id="name" className="input" type="text" placeholder="e.g. Nusrat Jahan"
                value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="label">Phone Number</label>
              <input id="phone" className="input" type="tel" placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
                value={form.phone} onChange={e => update('phone', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="label">Email (optional)</label>
              <input id="email" className="input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => update('email', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input id="password" className="input" type="password" placeholder="At least 6 characters"
                value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
            </div>

            <button
              id="register-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={isLoading}
              style={{ marginTop: '8px' }}
            >
              {isLoading ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--color-muted)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--color-text)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
