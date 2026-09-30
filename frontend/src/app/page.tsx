'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Car,
  User,
  Zap,
  Target,
  CreditCard,
  MapPin,
  ShieldCheck,
  Key,
  X,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';

const DEMO_CREDENTIALS = [
  {
    role: 'Driver',
    name: 'Jashim Uddin',
    phone: '+8801711000001',
    email: 'jashim@dhakateslapool.com',
    desc: 'Owns 3-seat Tesla Bullet in Banani',
    icon: <Car size={16} />,
  },
  {
    role: 'Passenger',
    name: 'Nusrat Jahan',
    phone: '+8801811000002',
    email: 'nusrat@example.com',
    desc: 'Late commuter from Banani to Mohakhali',
    icon: <User size={16} />,
  },
  {
    role: 'Passenger',
    name: 'Rafiq Islam',
    phone: '+8801911000003',
    email: 'rafiq@example.com',
    desc: 'Heading from Banani to Gulshan 1',
    icon: <User size={16} />,
  },
  {
    role: 'Passenger',
    name: 'Shirin Akter',
    phone: '+8801611000004',
    email: 'shirin@example.com',
    desc: 'Tries for the 3rd pool seat',
    icon: <User size={16} />,
  },
];

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'DRIVER' ? '/driver' : '/passenger');
    }
  }, [user, router]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDemoModal(false);
    };
    if (showDemoModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDemoModal]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

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
      {/* Background subtle orbs */}
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
      <div style={{ textAlign: 'center', maxWidth: '1040px', width: '100%', animation: 'fadeIn 0.6s ease forwards', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'var(--color-accent)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(255, 255, 255, 0.12)',
          }}>
            <Zap size={36} color="var(--color-bg)" />
          </div>
        </div>

        <h1 className="gradient-text" style={{
          fontSize: '56px', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px',
        }}>
          Dhaka Tesla Pool
        </h1>

        <p style={{ fontSize: '22px', color: 'var(--color-muted)', marginBottom: '8px', fontWeight: 500 }}>
          Share a seat. Split the fare.
        </p>
        <p style={{ fontSize: '18px', color: 'var(--color-muted)', marginBottom: '36px', opacity: 0.8 }}>
          Survive Dhaka traffic.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
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

        {/* Sleek Wide Demo Credentials Trigger Button */}
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center', width: '100%' }}>
          <button
            id="view-demo-modal-btn"
            type="button"
            onClick={() => setShowDemoModal(true)}
            className="btn btn-outline hover-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '14px 20px',
              borderRadius: '12px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <Key size={16} color="var(--color-muted)" />
            <span style={{ fontWeight: 600 }}>Demo Credentials & Test Accounts</span>
            <span style={{
              fontSize: '11px',
              background: 'var(--color-surface2)',
              padding: '2px 8px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted)',
            }}>
              View
            </span>
          </button>
        </div>

        {/* Modern Interactive Feature Cards Showcase */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
          gap: '14px',
          marginTop: '6px',
        }}>
          {[
            {
              icon: <Zap size={18} />,
              title: 'Battery-powered Teslas',
              desc: 'Custom 3-seat electric fleet built for Banani traffic',
            },
            {
              icon: <Target size={18} />,
              title: 'Smart pool matching',
              desc: 'Algorithmic route grouping and seat allocation',
            },
            {
              icon: <CreditCard size={18} />,
              title: 'Fair fare splitting',
              desc: 'Transparent 30% pooling discount per passenger',
            },
            {
              icon: <MapPin size={18} />,
              title: 'Real-time tracking',
              desc: 'Live trip lifecycle from dispatch to arrival',
            },
            {
              icon: <ShieldCheck size={18} />,
              title: 'Secure auth',
              desc: 'Role-based access for drivers & riders',
            },
          ].map((feat) => (
            <div key={feat.title} className="feature-card">
              <div className="feature-icon-badge">
                {feat.icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)', marginBottom: '4px' }}>
                  {feat.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.4 }}>
                  {feat.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Credentials Custom Modal */}
      {showDemoModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowDemoModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease forwards',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
              position: 'relative',
              textAlign: 'left',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Key size={18} color="var(--color-text)" />
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Demo Credentials</h2>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                  Pre-configured accounts from the Banani Rush-Hour story.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                style={{
                  background: 'var(--color-surface2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-muted)',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Universal Password Banner */}
            <div style={{
              background: 'var(--color-surface2)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Universal Password for all accounts
                </div>
                <code style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.05em' }}>
                  Tesla@2024
                </code>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard('Tesla@2024', 'password')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <Copy size={13} /> Copy
              </button>
            </div>

            {/* Account List */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {DEMO_CREDENTIALS.map((cred) => (
                <div
                  key={cred.phone}
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge" style={{
                        fontSize: '10px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                      }}>
                        {cred.icon} {cred.role}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>
                      {cred.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginBottom: '8px' }}>
                      {cred.desc}
                    </div>
                  </div>

                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <code style={{ fontSize: '12px', color: 'var(--color-text)' }}>
                      {cred.phone}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(cred.phone, cred.name)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedPhone === cred.phone ? 'var(--color-success)' : 'var(--color-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Copy Phone Number"
                    >
                      {copiedPhone === cred.phone ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="btn btn-outline"
                style={{ fontSize: '13px' }}
              >
                Close
              </button>
              <Link href="/auth/login" style={{ textDecoration: 'none' }} onClick={() => setShowDemoModal(false)}>
                <button className="btn btn-primary" style={{ fontSize: '13px' }}>
                  Proceed to Sign In <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
