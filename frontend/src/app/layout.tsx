import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dhaka Tesla Pool — Share a seat. Split the fare.',
  description: 'Dhaka Tesla Pool is an electric ride-pooling platform for Dhaka\'s battery-powered Teslas. Share rides, split fares, and beat Dhaka traffic.',
  keywords: 'dhaka, ride pool, tesla, carpooling, bangladesh, ride sharing',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Dhaka Tesla Pool',
    description: 'Share a seat. Split the fare. Survive Dhaka traffic.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--color-surface2)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-bg)' } },
            error: { iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-bg)' } },
          }}
        />
      </body>
    </html>
  );
}
