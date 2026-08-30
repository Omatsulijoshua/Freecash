'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, DollarSign, Award, CheckCircle2, ShieldAlert, Settings, FileText, ArrowUpRight, Activity } from 'lucide-react';

export default function AdminOverviewPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setKpis(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center text-sm font-bold text-slate-400">Loading Master Control Center...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5" /> MASTER CONTROL CENTER
          </div>
          <h1 className="text-3xl font-extrabold">Executive System Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time platform financial performance, user growth, and operational health</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/admin/users" className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs">
            Users Directory
          </Link>
          <Link href="/dashboard/admin/withdrawals" className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs">
            Withdrawal Queue
          </Link>
          <Link href="/dashboard/admin/fraud" className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-xs">
            Fraud Control
          </Link>
          <Link href="/dashboard/admin/settings" className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 font-bold text-xs">
            System Settings
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Platform GMV</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">₦{(kpis?.totalGmv || 0).toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 font-medium">Deposited campaign budget</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Net Platform Revenue (20%)</span>
          <div className="text-3xl font-black text-emerald-500">₦{(kpis?.netRevenue || 0).toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 font-medium">Accumulated platform commissions</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Registered Users</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{kpis?.totalUsers || 0}</div>
          <p className="text-[11px] text-slate-400 font-medium">
            {kpis?.earnersCount || 0} Earners • {kpis?.advertisersCount || 0} Advertisers
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Task Completions</span>
          <div className="text-3xl font-black text-primary-600 dark:text-primary-400">{kpis?.totalCompletions || 0}</div>
          <p className="text-[11px] text-slate-400 font-medium">{kpis?.activeCampaignsCount || 0} Active Campaigns</p>
        </div>
      </div>

      {/* Navigation Quick Access Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/admin/users"
          className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm hover:border-primary-500 transition-all space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-primary-600 flex items-center justify-between">
            User Management <ArrowUpRight className="w-5 h-5" />
          </h3>
          <p className="text-xs text-slate-400">Manage user accounts, roles, statuses, and execute manual wallet balance adjustments with audit logs.</p>
        </Link>

        <Link
          href="/dashboard/admin/withdrawals"
          className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm hover:border-primary-500 transition-all space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-primary-600 flex items-center justify-between">
            Withdrawal Queue <ArrowUpRight className="w-5 h-5" />
          </h3>
          <p className="text-xs text-slate-400">Review pending bank withdrawal requests, approve payouts, or reject & refund earner balances.</p>
        </Link>

        <Link
          href="/dashboard/admin/settings"
          className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm hover:border-primary-500 transition-all space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Settings className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-primary-600 flex items-center justify-between">
            System Settings <ArrowUpRight className="w-5 h-5" />
          </h3>
          <p className="text-xs text-slate-400">Configure platform commission percentages, minimum withdrawal limits, and referral bonuses dynamically.</p>
        </Link>
      </div>
    </div>
  );
}
