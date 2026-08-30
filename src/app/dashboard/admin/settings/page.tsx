'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Save, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchSettings = () => {
    setLoading(true);
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSettings(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleEdit = (setting: any) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
    setMsg('');
    setErr('');
  };

  const handleSave = async (key: string) => {
    setSavingKey(key);
    setMsg('');
    setErr('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editValue }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setErr(resData.error || 'Failed to update setting');
        setSavingKey(null);
        return;
      }

      setMsg(resData.message || 'System setting updated live');
      setSavingKey(null);
      setEditingKey(null);
      fetchSettings();
    } catch (e) {
      setErr('An error occurred updating setting');
      setSavingKey(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Back to Master Admin Center
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <Settings className="w-3.5 h-3.5" /> DYNAMIC SYSTEM SETTINGS
          </div>
          <h1 className="text-3xl font-extrabold">System Parameters & Configuration</h1>
          <p className="text-xs text-slate-400 mt-1">Live dynamic configuration updates for platform commission rates, withdrawal thresholds, and referral bonuses</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      {err && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {err}
        </div>
      )}

      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-6">
        {loading ? (
          <div className="py-20 text-center text-sm font-bold text-slate-400">Loading System Settings...</div>
        ) : (
          <div className="space-y-4">
            {settings.map((s) => (
              <div key={s.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-lg">
                  <span className="font-mono font-bold text-xs text-primary-600 dark:text-primary-400">{s.key}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{s.description || 'System setting'}</p>
                </div>

                <div className="flex items-center gap-3">
                  {editingKey === s.key ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-xs font-bold text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleSave(s.key)}
                        disabled={savingKey === s.key}
                        className="px-3 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs inline-flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-white dark:bg-dark-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-700">
                        {s.value}
                      </span>
                      <button
                        onClick={() => handleEdit(s)}
                        className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
