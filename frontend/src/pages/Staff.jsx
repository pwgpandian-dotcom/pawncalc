import React, { useState, useEffect } from 'react';
import api from '../api/index';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'staff'];

export default function Staff() {
  const { user: me } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'staff' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const r = await api.get('/staff');
      setUsers(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3500);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/staff', form);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      setShowAdd(false);
      flash('Staff account created');
      load();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create user', true);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/staff/${id}`);
      flash('User deleted');
      setUsers(u => u.filter(x => x._id !== id));
    } catch (err) {
      flash(err.response?.data?.message || 'Delete failed', true);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      const r = await api.patch(`/staff/${id}`, { role });
      setUsers(u => u.map(x => x._id === id ? r.data : x));
      flash('Role updated');
    } catch (err) {
      flash(err.response?.data?.message || 'Update failed', true);
    }
  };

  if (me?.role !== 'admin') {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-slate-600 dark:text-slate-300">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">👥 Staff Management</h1>
          <p className="text-slate-500 text-sm">Manage admin and staff accounts</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)} className="btn-gold">
          {showAdd ? 'Cancel' : '➕ Add Staff'}
        </button>
      </div>

      {error   && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm">{success}</div>}

      {showAdd && (
        <div className="card p-6">
          <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-4">New Staff Account</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" type="text" autoComplete="name" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" inputMode="email" autoComplete="off" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@shop.com" />
            </div>
            <div>
              <label className="label">Password (min 6 chars)</label>
              <input className="input" type="password" autoComplete="new-password" required minLength={6} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-gold">
                {saving ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : (
          <div className="table-wrap border-0">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="font-semibold">
                      {u.name}
                      {u._id === me?.id && <span className="ml-2 text-xs text-gold-500 font-bold">(you)</span>}
                    </td>
                    <td className="text-slate-500">{u.email}</td>
                    <td>
                      {u._id === me?.id ? (
                        <span className={`badge-${u.role === 'admin' ? 'active' : 'closed'}`}>{u.role}</span>
                      ) : (
                        <select
                          className="input py-1 text-xs w-24"
                          value={u.role}
                          onChange={e => handleRoleChange(u._id, e.target.value)}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="text-slate-400 text-sm">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      {u._id !== me?.id && (
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
