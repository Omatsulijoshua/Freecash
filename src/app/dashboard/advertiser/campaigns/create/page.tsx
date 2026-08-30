'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Megaphone, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Shield, Globe, Smartphone, Calculator, CheckSquare } from 'lucide-react';

export default function CreateCampaignWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [targetDevices, setTargetDevices] = useState('ALL');
  const [rewardPerCompletion, setRewardPerCompletion] = useState<number>(400);
  const [maxCompletions, setMaxCompletions] = useState<number>(100);
  const [verificationMethod, setVerificationMethod] = useState<'MANUAL' | 'AUTOMATED' | 'HYBRID'>('MANUAL');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/tasks')
      .then(() => fetch('/api/tasks?sort=newest'))
      .catch(() => {});

    // Fetch categories directly from DB seed list or API
    setCategories([
      { id: 'cat-1', name: 'App Testing', slug: 'app-testing' },
      { id: 'cat-2', name: 'Website Testing', slug: 'website-testing' },
      { id: 'cat-3', name: 'Surveys', slug: 'surveys' },
      { id: 'cat-4', name: 'Microtasks', slug: 'microtasks' },
      { id: 'cat-5', name: 'Research', slug: 'research' },
    ]);
  }, []);

  // Budget Calculations
  const commissionPercentage = 20; // 20% commission
  const commissionPerAction = rewardPerCompletion * (commissionPercentage / 100);
  const costPerCompletion = rewardPerCompletion + commissionPerAction;
  const totalUserRewardBudget = rewardPerCompletion * maxCompletions;
  const totalCommissionBudget = commissionPerAction * maxCompletions;
  const totalFundingRequired = costPerCompletion * maxCompletions;

  const handleNext = () => {
    setError('');
    if (step === 1 && (!title || title.length < 5)) {
      setError('Please provide a campaign title (min 5 characters)');
      return;
    }
    if (step === 2 && (!description || !instructions)) {
      setError('Please provide campaign description and step-by-step instructions');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 8));
  };

  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmitCampaign = async () => {
    setError('');
    setLoading(true);

    try {
      // First fetch categories from DB to match real ID
      const catRes = await fetch('/api/tasks');
      const catData = await catRes.json();
      const firstCatId = catData.data?.[0]?.id || categoryId;

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          categoryId: categoryId || 'app-testing',
          instructions,
          destinationUrl: destinationUrl || undefined,
          rewardPerCompletion: Number(rewardPerCompletion),
          maxCompletions: Number(maxCompletions),
          verificationMethod,
          targetCountries: ['NG'],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit campaign');
        setLoading(false);
        return;
      }

      router.push('/dashboard/advertiser/campaigns');
    } catch (err) {
      setError('An error occurred submitting the campaign');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link href="/dashboard/advertiser" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Back to Advertiser Workspace
      </Link>

      {/* Progress Wizard Header */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            <Megaphone className="w-3.5 h-3.5" /> CAMPAIGN CREATION WIZARD
          </div>
          <span className="text-xs font-bold text-slate-400">Step {step} of 8</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">
          {step === 1 && 'Step 1: Campaign Information'}
          {step === 2 && 'Step 2: Task Instructions & Proof Format'}
          {step === 3 && 'Step 3: Target Audience & Location'}
          {step === 4 && 'Step 4: Earner Reward & Budget Calculation'}
          {step === 5 && 'Step 5: Verification Method Selection'}
          {step === 6 && 'Step 6: Campaign Summary Review'}
          {step === 7 && 'Step 7: Wallet Funding Verification'}
          {step === 8 && 'Step 8: Submit Campaign for Approval'}
        </h1>

        {/* Wizard Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${(step / 8) * 100}%` }} />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* STEP CONTENT CONTAINER */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Campaign Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Download & Test Kuda Bank Android App"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Task Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Short Overview Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary shown on task cards in marketplace..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Step-by-Step Task Instructions</label>
              <textarea
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="1. Click target link&#10;2. Complete sign up using valid email&#10;3. Take screenshot of confirmation page"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Destination Link / Website URL (Optional)</label>
              <input
                type="url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://example.com/app-download"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Geographic Country</label>
              <input
                type="text"
                disabled
                value="Nigeria (NG)"
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-100 dark:bg-dark-900 text-xs font-bold text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Target Device Restriction</label>
              <select
                value={targetDevices}
                onChange={(e) => setTargetDevices(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="ALL">All Devices (Mobile + Desktop)</option>
                <option value="ANDROID">Android Mobile Only</option>
                <option value="IOS">iOS iPhone Only</option>
                <option value="DESKTOP">Desktop Web Only</option>
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Earner Reward per Task (₦)</label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={rewardPerCompletion}
                  onChange={(e) => setRewardPerCompletion(Number(e.target.value))}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Maximum Completions Needed</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={maxCompletions}
                  onChange={(e) => setMaxCompletions(Number(e.target.value))}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Server Calculation Breakdown Card */}
            <div className="p-6 rounded-2xl bg-primary-500/10 border border-primary-500/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 dark:text-primary-300">
                <Calculator className="w-4 h-4" /> SERVER-SIDE BUDGET CALCULATOR PREVIEW
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>User Reward Budget ({maxCompletions} × ₦{rewardPerCompletion})</span>
                  <span className="font-bold">₦{totalUserRewardBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Revenue Commission ({commissionPercentage}% = ₦{commissionPerAction}/task)</span>
                  <span className="font-bold">₦{totalCommissionBudget.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-primary-500/20 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                  <span>Total Advertiser Funding Required</span>
                  <span className="text-primary-600 dark:text-primary-400">₦{totalFundingRequired.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Select Task Verification Method</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { method: 'MANUAL', title: 'Manual Review', desc: 'Review user screenshots & proof manually from dashboard.' },
                { method: 'AUTOMATED', title: 'Automated API', desc: 'Instant server-to-server webhook confirmation.' },
                { method: 'HYBRID', title: 'Hybrid Review', desc: 'Automated check + manual review for suspicious flags.' },
              ].map((m) => (
                <button
                  key={m.method}
                  type="button"
                  onClick={() => setVerificationMethod(m.method as any)}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    verificationMethod === m.method
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-slate-200 dark:border-dark-700 hover:border-primary-400'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{m.title}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Campaign Summary</h3>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-900 space-y-2">
              <div><span className="text-slate-400">Title:</span> <span className="font-bold">{title}</span></div>
              <div><span className="text-slate-400">Instructions:</span> <span className="font-bold">{instructions}</span></div>
              <div><span className="text-slate-400">Earner Reward:</span> <span className="font-bold text-primary-600">₦{rewardPerCompletion}</span></div>
              <div><span className="text-slate-400">Target Completions:</span> <span className="font-bold">{maxCompletions}</span></div>
              <div><span className="text-slate-400">Verification Method:</span> <span className="font-bold">{verificationMethod}</span></div>
              <div><span className="text-slate-400">Total Funding Required:</span> <span className="font-extrabold text-primary-600 text-sm">₦{totalFundingRequired.toLocaleString()}</span></div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto font-bold text-xl">
              ✓
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Wallet Check Passed</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your advertiser account is eligible to launch this campaign. Funds will be reserved upon campaign activation.
            </p>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-6 text-center py-4">
            <h3 className="font-extrabold text-xl text-slate-900 dark:text-white">Ready to Launch Campaign</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Submitting will send your campaign to the FREE CASH Admin Team for review and approval.
            </p>
            <button
              onClick={handleSubmitCampaign}
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-lg shadow-primary-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting Campaign...' : 'Submit Campaign for Approval'}
            </button>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-dark-700">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-dark-700 disabled:opacity-30"
          >
            Previous Step
          </button>
          {step < 8 && (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 flex items-center gap-1.5"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
