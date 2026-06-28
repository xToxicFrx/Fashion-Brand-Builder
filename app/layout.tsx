import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';

import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Know what to design next — Fashion Brand Builder',
    template: '%s — Fashion Brand Builder',
  },
  description:
    'AI trend intelligence for independent fashion designers: see which designs and products are about to trend, before you make them.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
