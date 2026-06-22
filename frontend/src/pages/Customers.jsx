import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import CustomerPhotoCapture from '../components/CustomerPhotoCapture';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [q, setQ]                 = useState('');
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ name: '', phone: '', phone2: '', address: '', idType: 'Aadhaar', idNumber: '', notes: '', photo: null });
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);

  const load = () => api.get(`/customers${q ? `?q=${q}` : ''}`).then(r => setCustomers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [q]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const reset = () => { setForm({ name: '', phone: '', phone2: '', address: '', idType: 'Aadhaar', idNumber: '', notes: '', photo: null }); setEditId(null); };

  const openEdit = c => { setForm({ name: c.name, phone: c.phone, phone2: c.phone2||'', address: c.address||'', idType: c.idType||'Aadhaar', idNumber: c.idNumber||'', notes: c.notes||'', photo: c.photo||null }); setEditId(c._id); setModal(true); };

  const submit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) await api.put(`/customers/${editId}`, form);
      else        await api.post('/customers', form);
      setModal(false); reset(); load();
    } finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!confirm(`Delete customer "${name}"?`)) return;
    try { await api.delete(`/customers/${id}`); load(); }
    catch (e) { alert(e.response?.data?.message || 'Cannot delete'); }
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Customers</h1>
          <p className="text-slate-500 text-sm">{customers.length} registered customers</p>
        </div>
        <button onClick={() => { reset(); setModal(true); }} className="btn-gold">➕ Add Customer</button>
      </div>

      <input className="input max-w-sm" placeholder="🔍 Search by name or phone…" value={q} onChange={e => setQ(e.target.value)} />

      <div className="card">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading…</div>
        ) : customers.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No customers found. Add your first customer!</div>
        ) : (
          <div className="table-wrap border-0">
            <table>
              <thead><tr><th>Photo</th><th>Name</th><th>Phone</th><th>Address</th><th>ID</th><th>Added</th><th></th></tr></thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>
                      {c.photo
                        ? <img src={c.photo} alt={c.name} className="w-9 h-9 rounded-lg object-cover border border-royal-100 dark:border-slate-700" />
                        : <div className="w-9 h-9 rounded-lg bg-royal-100 dark:bg-slate-700 flex items-center justify-center text-royal-400 font-bold text-sm">{c.name?.charAt(0)?.toUpperCase()}</div>
                      }
                    </td>
                    <td className="font-bold">{c.name}</td>
                    <td>
                      <div>{c.phone}</div>
                      {c.phone2 && <div className="text-xs text-slate-400">{c.phone2}</div>}
                    </td>
                    <td className="text-slate-500 text-sm">{c.address || '—'}</td>
                    <td className="text-sm">
                      {c.idType && <span className="font-semibold">{c.idType}</span>}
                      {c.idNumber && <div className="text-xs text-slate-400">{c.idNumber}</div>}
                    </td>
                    <td className="text-slate-400 text-sm">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-gold-500 hover:underline text-sm font-semibold">Edit</button>
                        <button onClick={() => del(c._id, c.name)} className="text-red-400 hover:underline text-sm font-semibold">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-800 dark:text-white text-lg">{editId ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => { setModal(false); reset(); }} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" required placeholder="Customer name" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input className="input" required placeholder="Phone number" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone 2</label>
                  <input className="input" placeholder="Alternate number" value={form.phone2} onChange={e => set('phone2', e.target.value)} />
                </div>
                <div>
                  <label className="label">ID Type</label>
                  <select className="input" value={form.idType} onChange={e => set('idType', e.target.value)}>
                    {['Aadhaar','PAN','Voter ID','Passport','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">ID Number</label>
                  <input className="input" placeholder="ID number" value={form.idNumber} onChange={e => set('idNumber', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <input className="input" placeholder="Full address" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
              <CustomerPhotoCapture value={form.photo} onChange={v => set('photo', v)} />
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-gold flex-1">{saving ? 'Saving…' : (editId ? '✅ Update' : '✅ Add Customer')}</button>
                <button type="button" onClick={() => { setModal(false); reset(); }} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
