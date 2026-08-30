'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, CheckCircle2, Clock, XCircle, ArrowRight, AlertTriangle } from 'lucide-react';

export default function TaskHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/tasks/history')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistory(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredHistory = history.filter((item) => {
    if (activeTab === 'ALL') return true;
    return item.status === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" /> EARNER WORKSPACE
          </div>
          <h1 className="text-3xl font-extrabold">Task History & Submission Status</h1>
          <p className="text-xs text-slate-400 mt-1">Track your active tasks, submissions under review, and approved earnings</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-dark-700">
        {[
          { label: 'All Participations', value: 'ALL' },
          { label: 'Started (Active)', value: 'STARTED' },
          { label: 'Under Review', value: 'SUBMITTED' },
          { label: 'Approved (Earned)', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === tab.value
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-300 hover:border-primary-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History Table / List */}
      {loading ? (
        <div className="py-20 text-center text-sm font-bold text-slate-400">Loading task history...</div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-20 text-center p-8 bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700">
          <p className="text-sm font-bold text-slate-500">No task participations match this filter.</p>
          <Link href="/tasks" className="mt-4 inline-block px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold">
            Browse Available Tasks
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-700 text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Started: {new Date(item.startedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{item.taskTitle}</h3>
                {item.proofText && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">Proof: "{item.proofText}"</p>
                )}
                {item.rejectionReason && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
                    Rejection Reason: {item.rejectionReason}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-0 border-slate-100 dark:border-dark-700">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">Reward</div>
                  <div className="text-lg font-black text-primary-600 dark:text-primary-400">
                    ₦{item.reward.toLocaleString()}
                  </div>
                </div>

                <div>
                  {item.status === 'APPROVED' && (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> APPROVED
                    </span>
                  )}
                  {item.status === 'SUBMITTED' && (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center gap-1">
                      <Clock className="w-4 h-4" /> UNDER REVIEW
                    </span>
                  )}
                  {item.status === 'STARTED' && (
                    <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 text-xs font-extrabold flex items-center gap-1">
                      <Clock className="w-4 h-4" /> IN PROGRESS
                    </span>
                  )}
                  {item.status === 'REJECTED' && (
                    <span className="px-3 py-1.5 rounded-xl bg-red-100 text-red-800 text-xs font-extrabold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> REJECTED
                    </span>
                  )}
                </div>

                <Link
                  href={`/tasks/${item.taskId}`}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-dark-700 hover:bg-primary-500 hover:text-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
