'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Sparkles, CheckCircle2, ArrowRight, Shield, Smartphone, Globe, FileSpreadsheet, CheckSquare } from 'lucide-react';

export default function TaskMarketplacePage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const categories = [
    { name: 'All Tasks', slug: '' },
    { name: 'App Testing', slug: 'app-testing' },
    { name: 'Website Testing', slug: 'website-testing' },
    { name: 'Surveys', slug: 'surveys' },
    { name: 'Microtasks', slug: 'microtasks' },
    { name: 'Research', slug: 'research' },
  ];

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('q', search);
    if (selectedCategory) query.set('category', selectedCategory);
    if (sortBy) query.set('sort', sortBy);

    fetch(`/api/tasks?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTasks(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, selectedCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-3 border border-primary-500/30">
            <Sparkles className="w-3.5 h-3.5" /> PAID-ACTION MARKETPLACE
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Explore Available Tasks</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Select verified paid tasks, complete required steps, submit evidence, and earn rewards directly credited to your wallet.
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-dark-800 p-4 rounded-2xl border border-slate-200 dark:border-dark-700 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or keyword..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="highest_reward">Highest Reward (₦)</option>
            <option value="fastest">Fastest Tasks</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setSelectedCategory(c.slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === c.slug
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-slate-300 hover:border-primary-500'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm font-bold text-slate-400">Loading marketplace tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="py-20 text-center p-8 bg-white dark:bg-dark-800 rounded-3xl border border-slate-200 dark:border-dark-700">
          <p className="text-sm font-bold text-slate-500">No active tasks match your search criteria.</p>
          <button onClick={() => { setSearch(''); setSelectedCategory(''); }} className="mt-4 text-xs font-bold text-primary-600 hover:underline">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm hover:border-primary-500/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 text-[10px] font-extrabold uppercase tracking-wider">
                    {t.category}
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" /> {t.verificationMethod}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug mb-2">
                  {t.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {t.description}
                </p>

                {/* Slots Progress */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Available Slots</span>
                    <span>{t.availableSlots} / {t.maxCompletions} left</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-dark-700 overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${Math.min(100, (t.currentCompletions / t.maxCompletions) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-dark-700 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Reward</div>
                  <div className="text-lg font-black text-primary-600 dark:text-primary-400">
                    ₦{t.reward.toLocaleString()}
                  </div>
                </div>
                <Link
                  href={`/tasks/${t.id}`}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all flex items-center gap-1.5"
                >
                  View Task <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
