'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Car, Home, MapPin, History, Wallet, LogOut, Zap, User } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  role: 'PASSENGER' | 'DRIVER';
}

export default function SidebarLayout({ children, navItems, role }: SidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    router.push('/');
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '0 24px 24px', borderBottom: '1px solid #1f2d4a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'var(--color-accent)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="var(--color-bg)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px' }}>Dhaka Tesla</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Pool</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'var(--color-surface2)',
            border: '1px solid var(--color-border)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '16px', color: 'var(--color-text)', marginBottom: '8px',
          }}>
            {user?.name?.[0] || '?'}
          </div>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>{user?.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{user?.phone}</div>
          <span className={`badge`} style={{ marginTop: '6px', display: 'inline-flex', gap: '4px', alignItems: 'center', background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
            {role === 'DRIVER' ? <Car size={12} /> : <User size={12} />} {role}
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '16px 0' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, padding: '0 16px' }}>
          <button
            className="btn btn-ghost btn-full"
            onClick={handleLogout}
            style={{ justifyContent: 'flex-start', gap: '12px', paddingLeft: '8px' }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
