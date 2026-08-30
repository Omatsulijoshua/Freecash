'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Filter, DollarSign, Edit3, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Adjustment Modal State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [balanceAdjustment, setBalanceAdjustment] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    fetch(`/api/admin/users?q=${search}&role=${roleFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleOpenModal = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setNewStatus(user.status);
    setBalanceAdjustment(0);
    setReason('');
    setMsg('');
    setErr('');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 3) {
      setErr('Mandatory audit reason is required (at least 3 characters)');
      return;
    }

    setSubmitting(true);
    setErr('');
    setMsg('');

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: newRole,
          status: newStatus,
          balanceAdjustment: Number(balanceAdjustment),
          reason,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setErr(resData.error || 'Failed to update user');
        setSubmitting(false);
        return;
      }

      setMsg(resData.message || 'User updated successfully');
      setSubmitting(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (e) {
      setErr('An error occurred updating user');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Back to Master Admin Center
      </Link>

      <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" /> USER MANAGEMENT DIRECTORY
          </div>
          <h1 className="text-3xl font-extrabold">Platform Users & Wallet Adjustments</h1>
          <p className="text-xs text-slate-400 mt-1">Search, modify roles, manage account statuses, and execute audit-logged wallet adjustments</p>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search email or full name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="EARNER">Earner Users</option>
            <option value="ADVERTISER">Advertiser Accounts</option>
            <option value="ADMIN">Admins</option>
            <option value="SUPPORT">Support Team</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-sm font-bold text-slate-400">Loading User Directory...</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">No users found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-dark-700 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">User Email</th>
                  <th className="pb-3">Full Name</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Wallet Balance</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-dark-900/50 transition-colors">
                    <td className="py-4 font-bold text-slate-900 dark:text-white">{u.email}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{u.fullName}</td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-700 text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                        u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 font-black text-slate-900 dark:text-white">₦{u.walletBalance.toLocaleString()}</td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleOpenModal(u)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit / Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User & Wallet Adjustment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="p-8 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 max-w-lg w-full shadow-2xl space-y-6">
            <h2 className="font-extrabold text-xl text-slate-900 dark:text-white">Modify User: {selectedUser.email}</h2>

            {err && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {err}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="EARNER">EARNER</option>
                  <option value="ADVERTISER">ADVERTISER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPPORT">SUPPORT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="FLAGGED">FLAGGED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Wallet Balance Adjustment (₦)
                </label>
                <span className="text-[10px] text-slate-400 block mb-1">
                  Current Balance: ₦{selectedUser.walletBalance.toLocaleString()}. Use positive value to credit, negative to debit.
                </span>
                <input
                  type="number"
                  step={100}
                  value={balanceAdjustment}
                  onChange={(e) => setBalanceAdjustment(Number(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manual refund for campaign test error..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save & Record Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
