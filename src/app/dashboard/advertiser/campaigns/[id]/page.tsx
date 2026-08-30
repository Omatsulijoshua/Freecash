'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, XCircle, ExternalLink, Shield } from 'lucide-react';

export default function SingleCampaignDetailsPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${params.id}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setData(resData.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="py-20 text-center text-sm font-bold text-slate-400">Loading Campaign Analytics...</div>;
  if (!data?.campaign) return <div className="py-20 text-center text-sm font-bold text-slate-400">Campaign Not Found</div>;

  const { campaign, participations } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/dashboard/advertiser/campaigns" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Back to Campaigns List
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase">{campaign.category}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">{campaign.title}</h1>
          <p className="text-xs text-slate-400 mt-1">Status: <span className="font-bold text-emerald-400 uppercase">{campaign.status}</span></p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Total Budget Allocated</span>
          <div className="text-2xl font-black text-primary-400">₦{campaign.totalBudget.toLocaleString()}</div>
        </div>
      </div>

      {/* Participations List */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
        <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">User Submissions ({participations.length})</h2>

        {participations.length === 0 ? (
          <p className="text-xs font-bold text-slate-400 py-8 text-center">No user submissions yet for this campaign.</p>
        ) : (
          <div className="space-y-3">
            {participations.map((p: any) => (
              <div key={p.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex flex-col sm:flex-row justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{p.userName} ({p.userEmail})</div>
                  {p.proofText && <div className="text-slate-500 mt-1 font-mono">Proof: "{p.proofText}"</div>}
                  {p.evidenceUrls.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {p.evidenceUrls.map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-primary-600 font-bold hover:underline inline-flex items-center gap-1">
                          Proof Screenshot #{idx + 1} <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase ${
                    p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : p.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
