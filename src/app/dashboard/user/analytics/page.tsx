'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Download, CheckCircle2, XCircle, Award, ArrowLeft } from 'lucide-react';

export default function UserAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/analytics')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setData(resData.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center text-sm font-bold text-slate-400">Loading Analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/dashboard/user" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" /> EARNINGS & PERFORMANCE ANALYTICS
          </div>
          <h1 className="text-3xl font-extrabold">Personal Earnings Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Track task completion efficiency, total rewards, and export financial reports</p>
        </div>

        <a
          href="/api/reports/transactions/export"
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-lg flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export Transactions CSV
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Participations</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{data?.totalParticipations || 0}</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Approved Submissions</span>
          <div className="text-3xl font-black text-emerald-500">{data?.approvedParticipations || 0}</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Completion Success Rate</span>
          <div className="text-3xl font-black text-primary-600 dark:text-primary-400">{data?.completionRate || 0}%</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Lifetime Earnings</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">₦{(data?.totalEarnings || 0).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
