import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import InstallPrompt from '@/components/InstallPrompt';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
});

export const metadata = {
  title: 'Brief Group — AI Infrastructure Intelligence',
  description:
    'Brief Group builds intelligent systems for smart energy monitoring, predictive maintenance, remote AI inspection, and digital marketplace infrastructure — born in Nigeria, built for the world.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo-192.png',
  },
};

export const viewport = {
  themeColor: '#12294F',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body bg-base-900 text-ink-100 antialiased">
        <AuthProvider>{children}</AuthProvider>
        <InstallPrompt />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
