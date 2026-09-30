'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(phone, password);
      const user = useAuthStore.getState().user;
      toast.success(`Welcome back, ${user?.name}! 👋`);
      router.push(user?.role === 'DRIVER' ? '/driver' : '/passenger');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      toast.error(message);
    }
  };

  const quickLogin = (p: string) => {
    setPhone(p);
    setPassword('Tesla@2024');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #111827 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '40px' }}>⚡</span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px', marginBottom: '8px' }}>Welcome back</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Sign in to Dhaka Tesla Pool</p>
        </div>

        <div className="glass" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Phone Number</label>
              <input
                id="phone"
                className="input"
                type="tel"
                placeholder="+8801711000001"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              id="login-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={isLoading}
              style={{ marginTop: '8px' }}
            >
              {isLoading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <hr className="divider" />

          {/* Quick login buttons */}
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick demo login
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: '🚗 Jashim (Driver)', phone: '+8801711000001' },
              { label: '👩 Nusrat', phone: '+8801811000002' },
              { label: '👨 Rafiq', phone: '+8801911000003' },
              { label: '👩 Shirin', phone: '+8801611000004' },
            ].map((u) => (
              <button
                key={u.phone}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => quickLogin(u.phone)}
                style={{ fontSize: '12px', textAlign: 'left', justifyContent: 'flex-start' }}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          No account?{' '}
          <Link href="/auth/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: '#475569' }}>
          Password for all demo accounts: <code style={{ color: '#8b5cf6' }}>Tesla@2024</code>
        </p>
      </div>
    </div>
  );
}
