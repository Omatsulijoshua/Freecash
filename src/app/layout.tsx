import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FREE CASH — Paid-Action Marketplace | Complete Tasks & Earn Money',
  description: 'FREE CASH connects users with legitimate businesses that pay for completed tasks, app testing, surveys, and digital research.',
  keywords: ['paid tasks', 'microtasks', 'make money online', 'app testing', 'surveys', 'advertiser campaign', 'freecash'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
