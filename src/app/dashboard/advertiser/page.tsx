'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, PlusCircle, TrendingUp, DollarSign, LogOut } from 'lucide-react';

export default function AdvertiserDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || (data.data.user.role !== 'ADVERTISER' && data.data.user.role !== 'ADMIN')) {
          router.push('/login');
        } else {
          setUserData(data.data.user);
        }
        setLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Loading Advertiser Workspace...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white flex items-center justify-between shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
            <Megaphone className="w-3.5 h-3.5" /> ROLE: ADVERTISER
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{userData?.advertiserProfile?.companyName || userData?.profile?.fullName}</h1>
          <p className="text-xs text-slate-400 mt-1">Manage paid task campaigns and campaign funding</p>
        </div>
        <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm">
          <span className="text-xs font-bold text-slate-500">Total Campaigns</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">0</div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm">
          <span className="text-xs font-bold text-slate-500">Total Spent</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">₦0.00</div>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm">
          <span className="text-xs font-bold text-slate-500">Completed Actions</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">0</div>
        </div>
      </div>
    </div>
  );
}
