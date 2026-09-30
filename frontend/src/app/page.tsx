'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { Car, User, Zap, Target, CreditCard, MapPin, ShieldCheck, Key } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'DRIVER' ? '/driver' : '/passenger');
    }
  }, [user, router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '10%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Hero content */}
      <div style={{ textAlign: 'center', maxWidth: '700px', animation: 'fadeIn 0.6s ease forwards' }}>
        {/* Logo */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          <Zap size={64} color="var(--color-text)" />
        </div>

        <h1 className="gradient-text" style={{
          fontSize: '56px', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px',
        }}>
          Dhaka Tesla Pool
        </h1>

        <p style={{ fontSize: '22px', color: 'var(--color-muted)', marginBottom: '12px', fontWeight: 500 }}>
          Share a seat. Split the fare.
        </p>
        <p style={{ fontSize: '18px', color: 'var(--color-muted)', marginBottom: '48px', opacity: 0.8 }}>
          Survive Dhaka traffic.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
          <Link href="/auth/login" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary btn-lg">
              Sign In
            </button>
          </Link>
          <Link href="/auth/register" style={{ textDecoration: 'none' }}>
            <button className="btn btn-outline btn-lg">
              Create Account
            </button>
          </Link>
        </div>

        {/* Demo credentials */}
        <div className="glass" style={{ padding: '24px', marginBottom: '48px', textAlign: 'left' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Key size={16} /> Demo Credentials — All use password: <code style={{ color: 'var(--color-text)', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Tesla@2024</code>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { icon: <Car size={14}/>, role: 'Driver', name: 'Jashim Uddin', email: 'jashim@dhakateslapool.com', badge: 'DRIVER' },
              { icon: <User size={14}/>, role: 'Passenger', name: 'Nusrat Jahan', email: 'nusrat@example.com', badge: 'PASSENGER' },
              { icon: <User size={14}/>, role: 'Passenger', name: 'Rafiq Islam', email: 'rafiq@example.com', badge: 'PASSENGER' },
              { icon: <User size={14}/>, role: 'Passenger', name: 'Shirin Akter', email: 'shirin@example.com', badge: 'PASSENGER' },
            ].map((cred) => (
              <div key={cred.email} style={{
                background: 'var(--color-surface2)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-muted)', marginBottom: '4px' }}>
                  {cred.icon} {cred.role}
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{cred.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text)', opacity: 0.8, fontFamily: 'monospace' }}>{cred.email}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-muted)', textAlign: 'center' }}>
            Login with phone number (e.g. <code style={{ color: 'var(--color-text)', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>+8801711000001</code> for Jashim)
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: <Zap size={14} />, text: 'Battery-powered Teslas' },
            { icon: <Target size={14} />, text: 'Smart pool matching' },
            { icon: <CreditCard size={14} />, text: 'Fair fare splitting' },
            { icon: <MapPin size={14} />, text: 'Real-time tracking' },
            { icon: <ShieldCheck size={14} />, text: 'Secure auth' },
          ].map((feat) => (
            <span key={feat.text} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              fontSize: '13px',
              color: 'var(--color-muted)',
            }}>
              {feat.icon} {feat.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
