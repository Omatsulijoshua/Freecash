'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, Wallet, Users, User, Menu, X, Shield, BarChart3, HelpCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

export default function MobileNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { label: 'Tasks', href: '/tasks', icon: Layers },
    { label: 'Wallet', href: '/dashboard/user/wallet', icon: Wallet },
    { label: 'Referrals', href: '/dashboard/user/referrals', icon: Users },
    { label: 'Profile', href: '/dashboard/user/profile', icon: User },
  ];

  return (
    <>
      {/* Top Bar for Mobile & Desktop */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-primary-600 dark:text-primary-400">
            FREE CASH <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-bold uppercase">v2.0</span>
          </Link>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="md:hidden p-2.5 rounded-2xl bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-slate-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle navigation drawer"
            >
              {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Drawer Menu */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 md:hidden flex justify-end">
          <div className="w-4/5 max-w-xs h-full bg-white dark:bg-dark-800 border-l border-slate-200 dark:border-dark-700 p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-dark-700">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Navigation Menu</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                <Link
                  href="/tasks"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700 min-h-[44px]"
                >
                  <Layers className="w-4 h-4 text-primary-600" /> Marketplace Tasks
                </Link>
                <Link
                  href="/dashboard/user/history"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700 min-h-[44px]"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-500" /> Task History
                </Link>
                <Link
                  href="/dashboard/user/wallet"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700 min-h-[44px]"
                >
                  <Wallet className="w-4 h-4 text-amber-500" /> Wallet & Withdraw
                </Link>
                <Link
                  href="/dashboard/user/referrals"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700 min-h-[44px]"
                >
                  <Users className="w-4 h-4 text-purple-500" /> Referrals Engine
                </Link>
                <Link
                  href="/dashboard/user/support"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700 min-h-[44px]"
                >
                  <HelpCircle className="w-4 h-4 text-blue-500" /> Support Desk
                </Link>
                <Link
                  href="/dashboard/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-700 min-h-[44px]"
                >
                  <Shield className="w-4 h-4 text-red-500" /> Admin Control
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar for Mobile (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-dark-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-dark-700 px-2 py-2 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-xl transition-all ${
                isActive ? 'text-primary-600 dark:text-primary-400 font-extrabold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
