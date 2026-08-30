'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HelpCircle, Filter, CheckCircle2, MessageSquare, Shield, Clock, Send } from 'lucide-react';

export default function SupportStaffDashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicketThread, setActiveTicketThread] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    fetch(`/api/tickets?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTickets(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleOpenTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    fetch(`/api/tickets/${ticketId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setActiveTicketThread(data.data);
      });
  };

  const handleSendStaffReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicketId) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (res.ok) {
        setReplyMessage('');
        handleOpenTicket(selectedTicketId);
        fetchTickets();
      }
      setSubmitting(false);
    } catch (e) {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assignToMe: true }),
      });

      if (res.ok) {
        handleOpenTicket(selectedTicketId);
        fetchTickets();
      }
    } catch (e) {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" /> SUPPORT OPERATIONS DESK
          </div>
          <h1 className="text-3xl font-extrabold">Customer Support Tickets Queue</h1>
          <p className="text-xs text-slate-400 mt-1">Review user tickets, resolve payment disputes, and communicate with earners</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm flex items-center justify-between">
        <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">Support Ticket Queue</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="WAITING_USER">WAITING_USER</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Grid: Tickets List & Active Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">Loading Support Queue...</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">No tickets found.</div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => handleOpenTicket(t.id)}
                className={`p-5 rounded-3xl border shadow-sm cursor-pointer transition-all ${
                  selectedTicketId === t.id
                    ? 'border-primary-500 bg-primary-500/5 dark:bg-primary-500/10'
                    : 'bg-white dark:bg-dark-800 border-slate-200 dark:border-dark-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-dark-700 text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300">
                    {t.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{t.subject}</h3>
                <p className="text-[11px] text-slate-400 mt-1">User: {t.userName} ({t.userEmail})</p>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Active Thread Workspace */}
        <div className="lg:col-span-7">
          {!activeTicketThread ? (
            <div className="p-12 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-center text-xs font-bold text-slate-400">
              Select a ticket from the left queue to view thread & reply
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-dark-700">
                <div>
                  <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">{activeTicketThread.subject}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Requester: {activeTicketThread.userName} ({activeTicketThread.userEmail})</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                </div>
              </div>

              {/* Message Feed */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {activeTicketThread.messages.map((m: any) => {
                  const isStaff = m.senderRole === 'SUPPORT' || m.senderRole === 'ADMIN';
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border text-xs space-y-1 ${
                        isStaff ? 'bg-primary-500/10 border-primary-500/20 ml-6' : 'bg-slate-50 dark:bg-dark-900 border-slate-200 dark:border-dark-700 mr-6'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span>{m.senderName} ({m.senderRole})</span>
                        <span className="text-[10px] font-normal text-slate-400">{new Date(m.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{m.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Staff Reply Form */}
              <form onSubmit={handleSendStaffReply} className="space-y-3 pt-2">
                <textarea
                  rows={3}
                  placeholder="Type official support staff response..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !replyMessage.trim()}
                    className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> {submitting ? 'Sending...' : 'Send Staff Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
