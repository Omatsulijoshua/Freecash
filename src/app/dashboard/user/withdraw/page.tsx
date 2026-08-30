'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, AlertCircle, ArrowLeft, Shield, DollarSign, Send } from 'lucide-react';

export default function EarnerWithdrawPage() {
  const [banks, setBanks] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedAccountName, setResolvedAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [amount, setAmount] = useState<number>(1000);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/payments/banks').then((res) => res.json()),
      fetch('/api/wallet').then((res) => res.json()),
    ])
      .then(([banksData, walletData]) => {
        if (banksData.success) setBanks(banksData.data);
        if (walletData.success) setBalance(walletData.data.wallet.balance);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleResolveAccount = async () => {
    if (!selectedBankCode || accountNumber.length !== 10) return;
    setResolving(true);
    setError('');

    try {
      const res = await fetch('/api/payments/bank/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankCode: selectedBankCode, accountNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resolve bank account');
        setResolving(false);
        return;
      }
      setResolvedAccountName(data.data.accountName);
      setResolving(false);
    } catch (err) {
      setError('An error occurred resolving bank account');
      setResolving(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    const bank = banks.find((b) => b.code === selectedBankCode);
    const bankName = bank ? bank.name : 'Nigerian Bank';

    try {
      const res = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          bankCode: selectedBankCode,
          bankName,
          accountNumber,
          accountName: resolvedAccountName || 'VERIFIED HOLDER',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to process withdrawal');
        setSubmitting(false);
        return;
      }

      setSuccessMsg('Withdrawal request submitted successfully! Funds will arrive in your bank account shortly.');
      setSubmitting(false);
      setBalance((prev) => prev - Number(amount));
    } catch (err) {
      setError('An error occurred requesting withdrawal');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-sm font-bold text-slate-400">Loading Payment System...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/dashboard/user/wallet" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Back to Wallet
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" /> BANK WITHDRAWAL ENGINE
          </div>
          <h1 className="text-3xl font-extrabold">Request Bank Transfer Payout</h1>
          <p className="text-xs text-slate-400 mt-1">Withdraw your earned task rewards directly to any Nigerian commercial bank account</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Available Balance</span>
          <div className="text-3xl font-black text-emerald-400">₦{balance.toLocaleString()}</div>
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

      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-6">
        <form onSubmit={handleWithdraw} className="space-y-6">
          {/* Bank Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Select Destination Bank</label>
            <select
              value={selectedBankCode}
              onChange={(e) => setSelectedBankCode(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">Select Commercial Bank or MFB...</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Account Number & Name Resolution */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">10-Digit NUBAN Account Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0123456789"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleResolveAccount}
                disabled={resolving || accountNumber.length !== 10 || !selectedBankCode}
                className="px-4 py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs whitespace-nowrap disabled:opacity-40"
              >
                {resolving ? 'Verifying...' : 'Verify Account'}
              </button>
            </div>

            {resolvedAccountName && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-extrabold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Account Verified: {resolvedAccountName}
              </div>
            )}
          </div>

          {/* Withdrawal Amount */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Withdrawal Amount (₦)</label>
              <span className="text-[11px] font-bold text-slate-400">Min Threshold: ₦1,000</span>
            </div>
            <input
              type="number"
              min={1000}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || amount < 1000 || amount > balance}
            className="w-full py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Processing Payout Request...' : `Withdraw ₦${amount.toLocaleString()} Now`}
          </button>
        </form>
      </div>
    </div>
  );
}
