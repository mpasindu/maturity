import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider';
import { Toaster } from '@/components/ui/Toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Enterprise Architecture Maturity Assessment Platform',
  description: 'Comprehensive platform for evaluating enterprise architecture maturity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          {children}
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}