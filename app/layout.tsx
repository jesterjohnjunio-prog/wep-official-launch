import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { EVENT, venueEn } from '@/lib/config';
import './globals.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Official Launch · MWSS RO Water Efficiency Program',
  description: `Registration for the ${EVENT.title} of the MWSS Regulatory Office — ${EVENT.dateEn}, ${EVENT.time}, ${venueEn()}.`,
  icons: { icon: '/wep-logo.png', apple: '/wep-logo.png' },
  openGraph: {
    title: 'Official Launch — MWSS RO Water Efficiency Program',
    description: `Register your barangay for the ${EVENT.title} on ${EVENT.dateEn}.`,
    images: ['/brand/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#04407f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fil" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
