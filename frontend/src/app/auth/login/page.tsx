'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { Zap, Car, User, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
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
    try {
      await login(phone, password);
      const user = useAuthStore.getState().user;
      toast.success(`Welcome back, ${user?.name}!`);
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
      background: 'var(--color-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Back to Landing Page link */}
        <div style={{ marginBottom: '18px' }}>
          <Link
            id="back-to-home-link"
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-muted)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--color-border)',
            }}
            className="hover-card"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-block' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(255, 255, 255, 0.1)',
              }}>
                <Zap size={28} color="var(--color-bg)" />
              </div>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Welcome back</h1>
          </Link>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px' }}>Sign in to Dhaka Tesla Pool</p>
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
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '12px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick demo login
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { icon: <Car size={14}/>, label: 'Jashim (Driver)', phone: '+8801711000001' },
              { icon: <User size={14}/>, label: 'Nusrat', phone: '+8801811000002' },
              { icon: <User size={14}/>, label: 'Rafiq', phone: '+8801911000003' },
              { icon: <User size={14}/>, label: 'Shirin', phone: '+8801611000004' },
            ].map((u) => (
              <button
                key={u.phone}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => quickLogin(u.phone)}
                style={{ fontSize: '12px', textAlign: 'left', justifyContent: 'flex-start' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {u.icon} {u.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--color-muted)' }}>
          No account?{' '}
          <Link href="/auth/register" style={{ color: 'var(--color-text)', textDecoration: 'none', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px', color: 'var(--color-muted)' }}>
          Password for all demo accounts: <code style={{ color: 'var(--color-text)', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>Tesla@2024</code>
        </p>
      </div>
    </div>
  );
}
