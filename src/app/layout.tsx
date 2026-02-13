import type { Metadata } from 'next';

import { AppShell } from '@/components/layout/app-shell';
import { AppToaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'Payrix API Tester',
  description: 'Worldpay Payrix TriPOS API testing dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
        <AppToaster />
      </body>
    </html>
  );
}
