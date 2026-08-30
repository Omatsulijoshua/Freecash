import Link from 'next/link';
import { 
  CheckCircle2, 
  ArrowRight, 
  Smartphone, 
  Globe, 
  UserCheck, 
  FileSpreadsheet, 
  ShieldCheck, 
  Wallet, 
  TrendingUp, 
  Lock,
  Sparkles,
  Zap,
  Award
} from 'lucide-react';

export default function Home() {
  const taskCategories = [
    { title: 'App Testing', desc: 'Download apps, test user flows, and provide feedback.', reward: '₦300 - ₦1,500', icon: Smartphone, bg: 'bg-emerald-500/10 text-emerald-600' },
    { title: 'Website Testing', desc: 'Visit websites, verify registration forms & report issues.', reward: '₦250 - ₦1,000', icon: Globe, bg: 'bg-blue-500/10 text-blue-600' },
    { title: 'Surveys & Feedback', desc: 'Share your opinions on consumer products and services.', reward: '₦400 - ₦2,000', icon: FileSpreadsheet, bg: 'bg-purple-500/10 text-purple-600' },
    { title: 'Data & Microtasks', desc: 'Simple data labeling, research tasks, and content checks.', reward: '₦150 - ₦800', icon: UserCheck, bg: 'bg-amber-500/10 text-amber-600' },
  ];

  const benefits = [
    { title: 'Instant Verification', desc: 'Automated API tracking and fast manual review pipeline ensure quick approvals.' },
    { title: 'Guaranteed Payouts', desc: 'Rewards are held in escrow when campaign launches and credited directly to your wallet.' },
    { title: 'Multiple Withdrawal Options', desc: 'Withdraw straight to your local Nigerian bank account with zero hassle.' },
    { title: 'Anti-Fraud Protection', desc: 'Multi-signal risk detection ensures legitimate tasks and prevents spam.' },
  ];

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 overflow-hidden bg-gradient-to-b from-primary-500/5 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950/80 dark:text-primary-300 text-xs font-semibold mb-6 border border-primary-200 dark:border-primary-800">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            Nigeria’s #1 Paid-Action Marketplace
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Complete Tasks. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-emerald-500 to-teal-500">
              Earn Real Money.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            FREE CASH connects people with verified businesses that pay for legitimate tasks, app testing, research, and digital actions.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-2xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/30 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              Start Earning Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#advertisers"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-2xl text-slate-700 dark:text-slate-200 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-700 transition-all"
            >
              Advertise With Us
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-dark-800 pt-10">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">₦50M+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Paid to Earners</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-primary-600 dark:text-primary-400">100k+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Completed Tasks</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">500+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Active Advertisers</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Verified Actions</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Simple Process</h2>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">How FREE CASH Works</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Discover Tasks', desc: 'Browse available tasks filtered by reward, category, and completion time.' },
            { step: '02', title: 'Complete Action', desc: 'Follow step-by-step instructions provided by verified advertisers.' },
            { step: '03', title: 'Instant Verification', desc: 'Automated tracking or fast manual review confirms your task completion.' },
            { step: '04', title: 'Withdraw Funds', desc: 'Get paid directly into your Nigerian bank account with zero stress.' },
          ].map((item, idx) => (
            <div key={idx} className="relative p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-black text-sm flex items-center justify-center mb-4">
                {item.step}
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR TASKS */}
      <section id="tasks" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Marketplace</h2>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">Popular Task Categories</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {taskCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm hover:border-primary-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{cat.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{cat.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-700 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Average Pay</span>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{cat.reward}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* WHY FREE CASH */}
      <section id="security" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Built with Bank-Grade Security
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
              Why FREE CASH is Built for Absolute Trust
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-sm">{b.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOR BUSINESSES / ADVERTISERS */}
      <section id="advertisers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              For Businesses & App Developers
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pay Only for Real, Measurable Results
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Launch targeted campaigns for app downloads, user signups, website testing, and surveys. Set your budget, define task evidence requirements, and watch real users perform actions in real-time.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                'Flexible campaign budgeting (deposit only what you spend)',
                'Automated API callbacks & webhook completion tracking',
                'Advanced target filtering by device, location, & demographic',
                'Dedicated support & fraud-prevention monitoring',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link
                href="/register?role=ADVERTISER"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Create Advertiser Account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Campaign Calculator Preview</h3>
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex justify-between items-center">
                <span className="text-slate-500">Target Completions</span>
                <span className="font-bold text-slate-900 dark:text-white">1,000 Users</span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex justify-between items-center">
                <span className="text-slate-500">Earner Reward per Action</span>
                <span className="font-bold text-primary-600 dark:text-primary-400">₦400</span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex justify-between items-center">
                <span className="text-slate-500">Platform Fee (Configurable 20%)</span>
                <span className="font-bold text-slate-900 dark:text-white">₦100 / task</span>
              </div>
              <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">Total Advertiser Budget</span>
                <span className="text-lg font-black text-primary-600 dark:text-primary-400">₦500,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
