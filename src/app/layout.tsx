import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dhaka Tesla Pool — Share a seat. Split the fare. Survive Dhaka traffic.',
  description: 'Dhaka Tesla Pool is a ride-pooling app for Dhaka\'s battery-powered Teslas. Share rides, split fares, and reduce traffic.',
  keywords: 'dhaka, ride pool, tesla, carpooling, bangladesh, ride sharing',
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
              background: '#1a2236',
              color: '#f1f5f9',
              border: '1px solid #1f2d4a',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
          }}
        />
      </body>
    </html>
  );
}
