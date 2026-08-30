'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wallet, ArrowDownRight, ArrowUpRight, ShieldCheck, History, DollarSign, Filter, RefreshCw } from 'lucide-react';

export default function UserWalletPage() {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [auditStatus, setAuditStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchWalletData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/wallet/summary').then((res) => res.json()),
      fetch(`/api/wallet/transactions?type=${typeFilter}`).then((res) => res.json()),
      fetch('/api/wallet/audit').then((res) => res.json()),
    ])
      .then(([summaryData, txData, auditData]) => {
        if (summaryData.success) setSummary(summaryData.data);
        if (txData.success) setTransactions(txData.data.transactions);
        if (auditData.success) setAuditStatus(auditData.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchWalletData();
  }, [typeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Wallet className="w-3.5 h-3.5" /> IMMUTABLE LEDGER WALLET
          </div>
          <h1 className="text-3xl font-extrabold">Wallet & Financial Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time audit-verified double-entry transaction history</p>
        </div>

        {auditStatus?.isReconciled && (
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> LEDGER AUDIT RECONCILED (100% ACCURATE)
          </div>
        )}
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Available Balance</span>
          <div className="text-3xl font-black text-primary-600 dark:text-primary-400">
            ₦{summary ? summary.currentBalance.toLocaleString() : '0'}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Ready for immediate withdrawal</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Lifetime Earnings</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            ₦{summary ? summary.totalEarned.toLocaleString() : '0'}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Total earned from completed tasks</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Withdrawn</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            ₦{summary ? summary.totalWithdrawn.toLocaleString() : '0'}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Paid out to bank accounts</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Pending Rewards</span>
          <div className="text-3xl font-black text-amber-500">
            ₦{summary ? summary.pendingBalance.toLocaleString() : '0'}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Submissions under review</p>
        </div>
      </div>

      {/* Transactions Table & Filters */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-primary-600" /> Immutable Transaction Ledger
          </h2>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Type:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Transactions</option>
              <option value="TASK_REWARD">Task Rewards</option>
              <option value="WITHDRAWAL">Withdrawals</option>
              <option value="BONUS">Bonuses</option>
              <option value="REFERRAL_REWARD">Referral Rewards</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm font-bold text-slate-400">Loading ledger records...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">No ledger transactions found matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-700 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Transaction Ref</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-dark-900/50 transition-colors">
                    <td className="py-4 font-mono font-bold text-slate-900 dark:text-white">{tx.reference}</td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-700 text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{tx.description}</td>
                    <td className="py-4 text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="py-4 text-right font-black text-sm">
                      {tx.direction === 'CREDIT' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                          <ArrowDownRight className="w-4 h-4" /> +₦{tx.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 flex items-center justify-end gap-1">
                          <ArrowUpRight className="w-4 h-4" /> -₦{tx.amount.toLocaleString()}
                        </span>
                      )}
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
