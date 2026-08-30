'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, XCircle, ArrowLeft, AlertCircle } from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchWithdrawals = () => {
    setLoading(true);
    fetch('/api/admin/withdrawals')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setWithdrawals(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleReview = async (withdrawalId: string, action: 'APPROVE' | 'REJECT') => {
    setMsg('');
    setErr('');
    setProcessingId(withdrawalId);

    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setErr(resData.error || 'Failed to review withdrawal');
        setProcessingId(null);
        return;
      }

      setMsg(resData.message || 'Withdrawal reviewed successfully');
      setProcessingId(null);
      setRejectingId(null);
      fetchWithdrawals();
    } catch (e) {
      setErr('An error occurred');
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Back to Master Admin Center
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" /> BANK WITHDRAWAL QUEUE
          </div>
          <h1 className="text-3xl font-extrabold">Earner Payout Review Queue</h1>
          <p className="text-xs text-slate-400 mt-1">Approve bank payouts or reject & refund funds back to earner wallets</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      {err && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {err}
        </div>
      )}

      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
        {loading ? (
          <div className="py-20 text-center text-sm font-bold text-slate-400">Loading Withdrawal Queue...</div>
        ) : withdrawals.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">No withdrawal requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-700 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Ref ID</th>
                  <th className="pb-3">Earner Account</th>
                  <th className="pb-3">Bank Details</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-dark-900/50 transition-colors">
                    <td className="py-4 font-mono font-bold text-slate-900 dark:text-white">{w.reference}</td>
                    <td className="py-4 font-bold text-slate-900 dark:text-white">
                      {w.userName}
                      <span className="block text-[11px] font-normal text-slate-400">{w.userEmail}</span>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">
                      {w.bankName} ({w.accountNumber})
                      <span className="block text-[11px] text-slate-400 font-bold">{w.accountName}</span>
                    </td>
                    <td className="py-4 font-black text-sm text-slate-900 dark:text-white">₦{w.amount.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                        w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        w.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {w.status === 'REQUESTED' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReview(w.id, 'APPROVE')}
                            disabled={processingId === w.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectingId(w.id)}
                            disabled={processingId === w.id}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs inline-flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Reviewed ({new Date(w.createdAt).toLocaleDateString()})</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Reject Withdrawal & Refund Earner</h3>
            <p className="text-xs text-slate-400">Specify reason for rejection. Funds will be immediately refunded to earner's wallet.</p>
            <textarea
              required
              rows={3}
              placeholder="e.g. Account name mismatch with bank records..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReview(rejectingId, 'REJECT')}
                disabled={processingId === rejectingId}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                Confirm Rejection & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
