'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, XCircle, ExternalLink, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AdvertiserVerificationQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchQueue = () => {
    fetch('/api/verifications/queue')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setQueue(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleReviewAction = async (submissionId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setError('');
    setSuccessMsg('');
    setReviewingId(submissionId);

    try {
      const res = await fetch('/api/verifications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          action,
          rejectionReason: reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to complete review action');
        setReviewingId(null);
        return;
      }

      setSuccessMsg(action === 'APPROVE' ? 'Submission approved and earner wallet credited!' : 'Submission rejected.');
      setRejectionModalId(null);
      setRejectionReason('');
      setReviewingId(null);
      fetchQueue();
    } catch (err) {
      setError('An error occurred during review');
      setReviewingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/dashboard/advertiser" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Back to Advertiser Workspace
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> VERIFICATION QUEUE
          </div>
          <h1 className="text-3xl font-extrabold">Pending Task Verifications</h1>
          <p className="text-xs text-slate-400 mt-1">Review earner proof submissions and release rewards to approved earners</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Pending Submissions</span>
          <div className="text-3xl font-black text-amber-400">{queue.length}</div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm font-bold text-slate-400">Loading pending verification queue...</div>
      ) : queue.length === 0 ? (
        <div className="py-20 text-center p-8 bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700">
          <p className="text-sm font-bold text-slate-500">🎉 All caught up! No pending verifications in queue.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {queue.map((item) => (
            <div key={item.submissionId} className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-dark-700">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 text-[10px] font-extrabold uppercase">
                    {item.category}
                  </span>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-1">{item.campaignTitle}</h3>
                  <p className="text-xs text-slate-500">Earner: <span className="font-bold text-slate-700 dark:text-slate-300">{item.earnerName}</span> ({item.earnerEmail})</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Completion Reward</span>
                  <div className="text-xl font-black text-primary-600 dark:text-primary-400">₦{item.reward.toLocaleString()}</div>
                </div>
              </div>

              {/* Proof Content */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 space-y-2 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300">Submitted Proof Text / Account ID:</div>
                <div className="font-mono text-slate-900 dark:text-white bg-white dark:bg-dark-800 p-3 rounded-xl border border-slate-200 dark:border-dark-700">
                  {item.proofText || 'No proof text provided.'}
                </div>

                {item.evidenceUrls.length > 0 && (
                  <div className="pt-2">
                    <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Uploaded Screenshot Evidence:</div>
                    <div className="flex flex-wrap gap-2">
                      {item.evidenceUrls.map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
                          View Screenshot #{idx + 1} <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setRejectionModalId(item.submissionId)}
                  disabled={reviewingId === item.submissionId}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Reject Task
                </button>
                <button
                  onClick={() => handleReviewAction(item.submissionId, 'APPROVE')}
                  disabled={reviewingId === item.submissionId}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Credit ₦{item.reward}
                </button>
              </div>

              {/* Rejection Modal Inline */}
              {rejectionModalId === item.submissionId && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3 mt-3">
                  <label className="block text-xs font-bold text-red-700">Provide Rejection Reason</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Screenshot blurry or account registration could not be found."
                    className="w-full p-2.5 rounded-xl border border-red-200 bg-white text-xs text-slate-900 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setRejectionModalId(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">Cancel</button>
                    <button
                      onClick={() => handleReviewAction(item.submissionId, 'REJECT', rejectionReason)}
                      disabled={!rejectionReason}
                      className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
