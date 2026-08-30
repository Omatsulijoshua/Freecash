'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, CheckCircle2, Trophy, Clock, ArrowUpRight, LogOut, User } from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          router.push('/login');
        } else {
          setUserData(data.data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-bold text-slate-500">
        Loading Earner Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-2">
            <User className="w-3.5 h-3.5" /> ROLE: EARNER / USER
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome back, {userData?.profile?.fullName || 'Earner'}!</h1>
          <p className="text-xs text-slate-400 mt-1">Referral Code: <span className="font-mono font-bold text-primary-400">{userData?.referralCode}</span></p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Wallet & Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Wallet Balance</span>
            <Wallet className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ₦{Number(userData?.wallet?.balance || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Available for instant withdrawal</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Pending Rewards</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ₦{Number(userData?.wallet?.pendingBalance || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Under verification</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Tasks Completed</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">0</div>
          <p className="text-[10px] text-slate-400 mt-1">Lifetime verified completions</p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Referral Earnings</span>
            <Trophy className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">₦0</div>
          <p className="text-[10px] text-slate-400 mt-1">Share {userData?.referralCode} to earn</p>
        </div>
      </div>
    </div>
  );
}
