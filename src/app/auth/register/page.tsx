'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'PASSENGER' });
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ ...form, email: form.email || undefined });
      const user = useAuthStore.getState().user;
      toast.success(`Welcome to Dhaka Tesla Pool, ${user?.name}! 🎉`);
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
      background: 'linear-gradient(135deg, #0a0f1e 0%, #111827 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '40px' }}>⚡</span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px', marginBottom: '8px' }}>Join the Pool</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Create your Dhaka Tesla Pool account</p>
        </div>

        <div className="glass" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">I am a...</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { value: 'PASSENGER', label: '🧑 Passenger', desc: 'Book rides' },
                  { value: 'DRIVER', label: '🚗 Driver', desc: 'Drive a Tesla' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => update('role', r.value)}
                    style={{
                      padding: '14px',
                      border: `2px solid ${form.role === r.value ? '#3b82f6' : '#1f2d4a'}`,
                      borderRadius: '10px',
                      background: form.role === r.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      color: form.role === r.value ? '#3b82f6' : '#64748b',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{r.label}</div>
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
              <input id="phone" className="input" type="tel" placeholder="+8801XXXXXXXXX"
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

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
