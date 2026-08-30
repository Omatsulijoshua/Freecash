'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Clock, ExternalLink, CheckCircle2, AlertCircle, ArrowLeft, Upload, Send } from 'lucide-react';

export default function TaskDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [taskData, setTaskData] = useState<any>(null);
  const [participation, setParticipation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proofText, setProofText] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTaskDetails = () => {
    fetch(`/api/tasks/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTaskData(data.data.task);
          setParticipation(data.data.userParticipation);
          if (data.data.userParticipation?.submission?.proofText) {
            setProofText(data.data.userParticipation.submission.proofText);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [params.id]);

  const handleStartTask = async () => {
    setError('');
    setStarting(true);
    try {
      const res = await fetch(`/api/tasks/${params.id}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start task');
        setStarting(false);
        return;
      }
      setParticipation(data.data);
      setSuccessMsg('Task session started! Follow the instructions below and submit your proof.');
      setStarting(false);
    } catch (err) {
      setError('An error occurred starting the task');
      setStarting(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tasks/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofText,
          evidenceUrls: evidenceUrl ? [evidenceUrl] : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit proof');
        setSubmitting(false);
        return;
      }

      setSuccessMsg('Your proof was submitted successfully! The advertiser will review it shortly.');
      setSubmitting(false);
      fetchTaskDetails();
    } catch (err) {
      setError('An error occurred submitting proof');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm font-bold text-slate-400">Loading task instructions...</div>;
  }

  if (!taskData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Task Not Found</h2>
        <Link href="/tasks" className="mt-4 inline-block text-xs font-bold text-primary-600 hover:underline">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link href="/tasks" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Task Marketplace
      </Link>

      {/* Task Header Card */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 text-xs font-extrabold uppercase">
              {taskData.category}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{taskData.title}</h1>
            <p className="text-xs text-slate-500 mt-1">Advertiser: <span className="font-bold text-slate-700 dark:text-slate-300">{taskData.advertiser.companyName}</span></p>
          </div>

          <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-right sm:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Completion Reward</span>
            <div className="text-3xl font-black text-primary-600 dark:text-primary-400">₦{taskData.reward.toLocaleString()}</div>
          </div>
        </div>

        {/* Task Meta Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-dark-700 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Slots Available</span>
            <div className="font-bold text-slate-900 dark:text-white">{taskData.availableSlots} / {taskData.maxCompletions}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Verification Method</span>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> {taskData.verificationMethod}
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Time Allowed</span>
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> 120 Minutes
            </div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Target Region</span>
            <div className="font-bold text-slate-900 dark:text-white">Nigeria (NG)</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Task Instructions */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
        <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Task Instructions</h2>
        <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-50 dark:bg-dark-900 p-4 rounded-2xl border border-slate-200 dark:border-dark-700">
          {taskData.instructions}
        </div>

        {taskData.destinationUrl && (
          <div className="pt-2">
            <a
              href={taskData.destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
            >
              Open Target Task URL <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Task Action & Submission Interface */}
      {!participation ? (
        <div className="p-8 rounded-3xl bg-slate-900 text-white text-center space-y-4 shadow-xl">
          <h3 className="font-extrabold text-xl">Ready to complete this task?</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Clicking Start Task reserves your slot for 2 hours while you complete the action and submit evidence.
          </p>
          <button
            onClick={handleStartTask}
            disabled={starting}
            className="px-8 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-600/30 transition-all disabled:opacity-50"
          >
            {starting ? 'Starting Task...' : 'Start Task Now'}
          </button>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-700">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Submit Task Evidence</h3>
              <p className="text-xs text-slate-500">Status: <span className="font-bold text-primary-600 uppercase">{participation.status}</span></p>
            </div>
            {participation.status === 'APPROVED' && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> APPROVED
              </span>
            )}
          </div>

          {participation.status === 'REJECTED' && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
              <span className="font-bold">Rejection Reason:</span> {participation.submission?.rejectionReason || 'Submission did not meet requirements.'}
            </div>
          )}

          <form onSubmit={handleSubmitProof} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Proof Text / Confirmation ID
              </label>
              <textarea
                rows={3}
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="Provide username, email used during signup, or confirmation ID..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Screenshot / Image Evidence URL
              </label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://storage.freecash.com/evidence/screenshot.jpg"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || participation.status === 'APPROVED'}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Evidence Proof'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
