'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Megaphone, PlusCircle, PauseCircle, PlayCircle, XCircle, ArrowRight, Eye } from 'lucide-react';

export default function AdvertiserCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = () => {
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCampaigns(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleToggleStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchCampaigns();
    } catch (err) {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
            <Megaphone className="w-3.5 h-3.5" /> CAMPAIGN MANAGEMENT
          </div>
          <h1 className="text-3xl font-extrabold">Your Paid Task Campaigns</h1>
          <p className="text-xs text-slate-400 mt-1">Monitor completion velocity, edit campaign status, and create new campaigns</p>
        </div>
        <Link
          href="/dashboard/advertiser/campaigns/create"
          className="px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-lg shadow-primary-600/30 flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Create New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm font-bold text-slate-400">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="py-20 text-center p-8 bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700">
          <p className="text-sm font-bold text-slate-500">You have not created any campaigns yet.</p>
          <Link
            href="/dashboard/advertiser/campaigns/create"
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4" /> Launch First Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div key={c.id} className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-dark-700 text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300">
                    {c.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : c.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {c.status}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{c.title}</h3>
                
                {/* Progress */}
                <div className="w-full max-w-xs space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Completions</span>
                    <span>{c.currentCompletions} / {c.maxCompletions}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-dark-700 overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, (c.currentCompletions / c.maxCompletions) * 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-0 border-slate-100 dark:border-dark-700">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">Cost / Completion</div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">₦{c.totalCostPerCompletion}</div>
                  <div className="text-[10px] text-slate-400">Total: ₦{c.totalBudget.toLocaleString()}</div>
                </div>

                <div className="flex items-center gap-2">
                  {c.status === 'ACTIVE' ? (
                    <button onClick={() => handleToggleStatus(c.id, 'PAUSED')} className="p-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" title="Pause Campaign">
                      <PauseCircle className="w-5 h-5" />
                    </button>
                  ) : c.status === 'PAUSED' ? (
                    <button onClick={() => handleToggleStatus(c.id, 'ACTIVE')} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" title="Resume Campaign">
                      <PlayCircle className="w-5 h-5" />
                    </button>
                  ) : null}

                  <Link href={`/dashboard/advertiser/campaigns/${c.id}`} className="p-2 rounded-xl bg-slate-100 dark:bg-dark-700 hover:bg-primary-500 hover:text-white transition-colors" title="View Submissions">
                    <Eye className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
