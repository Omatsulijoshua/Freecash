'use client';

import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-xl text-primary-600 dark:text-primary-400">
          FREE CASH <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-bold uppercase">v2.0</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-700 dark:text-slate-200">
          <Link href="/tasks" className="hover:text-primary-600 transition-colors">Task Marketplace</Link>
          <Link href="/dashboard/user/history" className="hover:text-primary-600 transition-colors">Task History</Link>
          <Link href="/dashboard/user/wallet" className="hover:text-primary-600 transition-colors">Wallet & Ledger</Link>
          <Link href="/dashboard/user/referrals" className="hover:text-primary-600 transition-colors">Referrals</Link>
          <Link href="/dashboard/advertiser/campaigns" className="hover:text-primary-600 transition-colors">Advertiser Hub</Link>
        </nav>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <ThemeToggle />
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs min-h-[44px] flex items-center justify-center transition-all shadow-md shadow-primary-600/20"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
