'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

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
      background: 'linear-gradient(135deg, #0a0f1e 0%, #111827 50%, #0d1b3e 100%)',
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
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '10%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Hero content */}
      <div style={{ textAlign: 'center', maxWidth: '700px', animation: 'fadeIn 0.6s ease forwards' }}>
        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '64px' }}>⚡</span>
        </div>

        <h1 style={{
          fontSize: '56px', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Dhaka Tesla Pool
        </h1>

        <p style={{ fontSize: '22px', color: '#94a3b8', marginBottom: '12px', fontWeight: 500 }}>
          Share a seat. Split the fare.
        </p>
        <p style={{ fontSize: '18px', color: '#64748b', marginBottom: '48px' }}>
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
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🎭 Demo Credentials — All use password: <code style={{ color: '#3b82f6' }}>Tesla@2024</code>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { role: '🚗 Driver', name: 'Jashim Uddin', email: 'jashim@dhakateslapool.com', badge: 'DRIVER' },
              { role: '🧑 Passenger', name: 'Nusrat Jahan', email: 'nusrat@example.com', badge: 'PASSENGER' },
              { role: '🧑 Passenger', name: 'Rafiq Islam', email: 'rafiq@example.com', badge: 'PASSENGER' },
              { role: '🧑 Passenger', name: 'Shirin Akter', email: 'shirin@example.com', badge: 'PASSENGER' },
            ].map((cred) => (
              <div key={cred.email} style={{
                background: 'rgba(26, 34, 54, 0.8)',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid #1f2d4a',
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{cred.role}</div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{cred.name}</div>
                <div style={{ fontSize: '12px', color: '#3b82f6', fontFamily: 'monospace' }}>{cred.email}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
            Login with phone number (e.g. <code style={{ color: '#8b5cf6' }}>+8801711000001</code> for Jashim)
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            '⚡ Battery-powered Teslas',
            '🎯 Smart pool matching',
            '💰 Fair fare splitting',
            '📍 Real-time tracking',
            '🔒 Secure auth',
          ].map((feat) => (
            <span key={feat} style={{
              padding: '8px 16px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '20px',
              fontSize: '13px',
              color: '#94a3b8',
            }}>
              {feat}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
