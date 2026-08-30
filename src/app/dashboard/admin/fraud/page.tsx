'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, AlertTriangle, CheckCircle2, UserX, RotateCcw, ArrowLeft } from 'lucide-react';

export default function AdminFraudControlPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchFraudLogs = () => {
    fetch('/api/admin/fraud/logs')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setData(resData.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchFraudLogs();
  }, []);

  const handleOverride = async (targetUserId: string, action: 'SUSPEND_ACCOUNT' | 'UNFLAG_ACCOUNT' | 'RESET_RISK_SCORE') => {
    setMsg('');
    setErr('');
    setProcessingId(targetUserId);

    try {
      const res = await fetch('/api/admin/fraud/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setErr(resData.error || 'Failed to execute override action');
        setProcessingId(null);
        return;
      }

      setMsg(resData.message || 'Action executed successfully');
      setProcessingId(null);
      fetchFraudLogs();
    } catch (e) {
      setErr('An error occurred');
      setProcessingId(null);
    }
  };

  if (loading) return <div className="py-20 text-center text-sm font-bold text-slate-400">Loading Anti-Fraud Control Center...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Back to Master Admin Center
      </Link>

      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> SECURITY & ANTI-FRAUD ENGINE
          </div>
          <h1 className="text-3xl font-extrabold">Fraud Detection Control Panel</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time risk scoring, IP velocity monitoring, duplicate proof detection, and account overrides</p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Flagged / Suspended Accounts</span>
          <div className="text-3xl font-black text-red-400">{data?.flaggedUsers?.length || 0}</div>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      {err && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {err}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Flagged Users</span>
          <div className="text-3xl font-black text-red-600 dark:text-red-400">{data?.flaggedUsers?.length || 0}</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Recent Fraud Signals</span>
          <div className="text-3xl font-black text-amber-500">{data?.fraudEvents?.length || 0}</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">High Risk Ranking</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{data?.highRiskScores?.length || 0}</div>
        </div>
      </div>

      {/* Flagged Accounts Management */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
        <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Flagged / Suspended User Accounts</h2>

        {!data?.flaggedUsers || data.flaggedUsers.length === 0 ? (
          <p className="text-xs font-bold text-slate-400 py-8 text-center">🎉 No accounts currently flagged for fraud risk.</p>
        ) : (
          <div className="space-y-4">
            {data.flaggedUsers.map((u: any) => (
              <div key={u.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{u.name} ({u.email})</span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                      u.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {u.status}
                    </span>
                  </div>

                  {u.reasons.length > 0 && (
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                      Signals: {u.reasons.join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {u.status !== 'SUSPENDED' && (
                    <button
                      onClick={() => handleOverride(u.id, 'SUSPEND_ACCOUNT')}
                      disabled={processingId === u.id}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <UserX className="w-3.5 h-3.5" /> Suspend
                    </button>
                  )}
                  <button
                    onClick={() => handleOverride(u.id, 'UNFLAG_ACCOUNT')}
                    disabled={processingId === u.id}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Unflag & Restore
                  </button>
                  <button
                    onClick={() => handleOverride(u.id, 'RESET_RISK_SCORE')}
                    disabled={processingId === u.id}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Score
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fraud Events Audit Stream */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
        <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Recent Fraud Signal Events</h2>

        {!data?.fraudEvents || data.fraudEvents.length === 0 ? (
          <p className="text-xs font-bold text-slate-400 py-6 text-center">No fraud events recorded.</p>
        ) : (
          <div className="space-y-3">
            {data.fraudEvents.map((e: any) => (
              <div key={e.id} className="p-4 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{e.userEmail}</span>
                  <span className="text-slate-400 ml-2">({e.signalType})</span>
                  <p className="text-slate-500 mt-0.5">{e.description}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-400">{e.ipAddress}</span>
                  <div className="text-[10px] text-slate-400">{new Date(e.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
