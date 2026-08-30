'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Globe, Lock, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UserProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('NG');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.data);
          setFullName(data.data.fullName || '');
          setPhoneNumber(data.data.phoneNumber || '');
          setCountry(data.data.country || 'NG');
        }
        setLoading(false);
      });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phoneNumber, country }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileErr(data.error || 'Failed to update profile');
        return;
      }
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      setProfileErr('An unexpected error occurred');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg('');
    setPassErr('');

    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPassErr(data.error || 'Failed to update password');
        return;
      }
      setPassMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPassErr('An unexpected error occurred');
    }
  };

  if (loading) return <div className="py-20 text-center text-sm font-bold text-slate-400">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="p-8 rounded-3xl bg-slate-900 text-white flex items-center justify-between shadow-xl">
        <div>
          <h1 className="text-3xl font-extrabold">Account Settings & Security</h1>
          <p className="text-xs text-slate-400 mt-1">Manage your personal profile, phone number, and security credentials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Details Form */}
        <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
          <h2 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" /> Personal Profile
          </h2>

          {profileMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {profileMsg}
            </div>
          )}
          {profileErr && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {profileErr}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+2348012345678"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="NG">Nigeria (NG)</option>
              </select>
            </div>

            <button type="submit" className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md transition-all">
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm space-y-4">
          <h2 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" /> Password & Security
          </h2>

          {passMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {passMsg}
            </div>
          )}
          {passErr && (
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {passErr}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password (Min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <button type="submit" className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
