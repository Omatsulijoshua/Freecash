'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Copy, CheckCircle2, Share2, DollarSign, Award, AlertCircle } from 'lucide-react';

export default function UserReferralsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchReferrals = () => {
    fetch('/api/referrals')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) setData(resData.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleCopy = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaim = async () => {
    setMsg('');
    setErr('');
    setClaiming(true);

    try {
      const res = await fetch('/api/referrals/claim', { method: 'POST' });
      const resData = await res.json();
      if (!res.ok) {
        setErr(resData.error || 'Failed to claim referral rewards');
        setClaiming(false);
        return;
      }

      setMsg(resData.message || 'Referral reward claimed successfully!');
      setClaiming(false);
      fetchReferrals();
    } catch (e) {
      setErr('An error occurred while claiming rewards');
      setClaiming(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-sm font-bold text-slate-400">Loading Referral Workspace...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" /> REFERRAL & GROWTH ENGINE
          </div>
          <h1 className="text-3xl font-extrabold">Earn ₦100 Per Friend Invited</h1>
          <p className="text-xs text-slate-400 mt-1">Invite friends to join FREE CASH. Earn instant referral rewards when they complete tasks.</p>
        </div>

        {data?.claimableBalance > 0 && (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-extrabold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-2"
          >
            <Award className="w-4 h-4" /> {claiming ? 'Claiming...' : `Claim ₦${data.claimableBalance.toLocaleString()} Reward`}
          </button>
        )}
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

      {/* Shareable Link Box */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
        <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Your Unique Referral Link</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            readOnly
            value={data?.referralLink || ''}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 font-mono text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-6 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Copy className="w-4 h-4" /> {copied ? 'Copied Link!' : 'Copy Referral Link'}
          </button>
        </div>

        {/* Social Share Controls */}
        <div className="pt-2 flex flex-wrap gap-3">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Earn money completing legitimate microtasks on FREE CASH! Sign up here: ${data?.referralLink}`)}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-700"
          >
            <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join FREE CASH and get paid for testing apps and completing tasks! ${data?.referralLink}`)}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-blue-600"
          >
            <Share2 className="w-3.5 h-3.5" /> Share on Twitter/X
          </a>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Referrals</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{data?.totalReferrals || 0}</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Active Qualified</span>
          <div className="text-3xl font-black text-emerald-500">{data?.activeReferrals || 0}</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Referral Earned</span>
          <div className="text-3xl font-black text-primary-600 dark:text-primary-400">₦{(data?.totalEarned || 0).toLocaleString()}</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Referral Code</span>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">{data?.referralCode}</div>
        </div>
      </div>

      {/* Referred Users List */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
        <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Invited Friends ({data?.referredUsers?.length || 0})</h2>

        {!data?.referredUsers || data.referredUsers.length === 0 ? (
          <p className="text-xs font-bold text-slate-400 py-8 text-center">No referrals yet. Share your link to start earning!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-700 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Joined Date</th>
                  <th className="pb-3">Completed Tasks</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {data.referredUsers.map((ref: any) => (
                  <tr key={ref.id}>
                    <td className="py-4 font-bold text-slate-900 dark:text-white">{ref.fullName}</td>
                    <td className="py-4 text-slate-400">{new Date(ref.joinedAt).toLocaleDateString()}</td>
                    <td className="py-4 font-bold">{ref.completedTasks} tasks</td>
                    <td className="py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                        ref.completedTasks > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
