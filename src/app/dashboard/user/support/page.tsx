'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HelpCircle, Plus, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function UserSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('PAYMENT_ISSUE');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchTickets = () => {
    setLoading(true);
    fetch('/api/tickets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTickets(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr('');
    setMsg('');

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, message }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setErr(resData.error || 'Failed to submit ticket');
        setSubmitting(false);
        return;
      }

      setMsg('Support ticket created successfully!');
      setSubmitting(false);
      setShowModal(false);
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (e) {
      setErr('An error occurred submitting ticket');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-2">
            <HelpCircle className="w-3.5 h-3.5" /> HELP & SUPPORT DESK
          </div>
          <h1 className="text-3xl font-extrabold">Support Tickets & Appeals</h1>
          <p className="text-xs text-slate-400 mt-1">Get fast resolution for payment issues, task disputes, and account inquiries</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-lg shadow-primary-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Open New Support Ticket
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      {/* Tickets List */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
        <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Your Support Requests ({tickets.length})</h2>

        {loading ? (
          <div className="py-20 text-center text-sm font-bold text-slate-400">Loading Support Tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">No support tickets found. Click above to open a ticket.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-dark-700">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/user/support/${t.id}`}
                className="p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors block"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{t.subject}</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-dark-700 text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-md">{t.lastMessage}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase ${
                    t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                    t.status === 'WAITING_USER' ? 'bg-amber-100 text-amber-800' : 'bg-primary-100 text-primary-800'
                  }`}>
                    {t.status}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(t.updatedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 max-w-lg w-full shadow-2xl space-y-6">
            <h2 className="font-extrabold text-xl text-slate-900 dark:text-white">Create Support Ticket</h2>

            {err && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {err}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="PAYMENT_ISSUE">Payment / Deposit Issue</option>
                  <option value="WITHDRAWAL_ISSUE">Bank Withdrawal Issue</option>
                  <option value="TASK_DISPUTE">Task Verification Dispute</option>
                  <option value="ACCOUNT_ISSUE">Account / Password Issue</option>
                  <option value="VERIFICATION_ISSUE">KYC Verification</option>
                  <option value="FRAUD_APPEAL">Risk Flag Appeal</option>
                  <option value="OTHER">Other Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delayed bank withdrawal payout..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide full context, transaction IDs, or task links..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
