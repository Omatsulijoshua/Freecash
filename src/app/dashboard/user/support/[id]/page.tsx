'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle2, Shield, User, Clock } from 'lucide-react';

export default function UserTicketThreadPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTicket = () => {
    fetch(`/api/tickets/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTicket(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTicket();
  }, [params.id]);

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tickets/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText }),
      });

      const data = await res.json();
      if (res.ok) {
        setReplyText('');
        fetchTicket();
      }
      setSubmitting(false);
    } catch (e) {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-sm font-bold text-slate-400">Loading Support Thread...</div>;
  if (!ticket) return <div className="py-20 text-center text-sm font-bold text-slate-400">Support Ticket Not Found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/dashboard/user/support" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Back to Support Desk
      </Link>

      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-bold uppercase">
              {ticket.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">
              {ticket.status}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold">{ticket.subject}</h1>
          <p className="text-xs text-slate-400 mt-1">Ticket ID: {ticket.id} • Opened {new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Message Thread */}
      <div className="space-y-4">
        {ticket.messages.map((m: any) => {
          const isStaff = m.senderRole === 'SUPPORT' || m.senderRole === 'ADMIN';
          return (
            <div
              key={m.id}
              className={`p-6 rounded-3xl border shadow-sm space-y-2 ${
                isStaff
                  ? 'bg-primary-500/5 dark:bg-primary-500/10 border-primary-500/20 ml-4 sm:ml-12'
                  : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 mr-4 sm:mr-12'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isStaff ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-dark-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    {isStaff ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{m.senderName}</span>
                  {isStaff && (
                    <span className="px-2 py-0.5 rounded-md bg-primary-500 text-white text-[9px] font-black uppercase">
                      Official Support Agent
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(m.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pl-10">
                {m.message}
              </p>
            </div>
          );
        })}
      </div>

      {/* Reply Form */}
      {ticket.status !== 'CLOSED' && (
        <form onSubmit={handlePostReply} className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-3">
          <textarea
            rows={3}
            placeholder="Type your reply message..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
