import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { fmt, calcInterest } from '../utils/calculations';
import { brand } from '../config/brand';

const today = () => new Date().toISOString().split('T')[0];

export default function NewLoan() {
  const navigate = useNavigate();
  const [customers, setCustomers]   = useState([]);
  const [customerQ, setCustomerQ]   = useState('');
  const [form, setForm]             = useState({
    customer: '', itemType: 'Gold', itemDescription: '', itemWeight: '', itemValue: '',
    principalAmount: '', interestRate: String(brand.goldRate), pawnDate: today(),
    expectedCloseDate: '', advanceInterestDeducted: false, notes: ''
  });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customerQ.length >= 2) {
      api.get(`/customers?q=${customerQ}`).then(r => setCustomers(r.data));
    } else {
      setCustomers([]);
    }
  }, [customerQ]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const advanceInterest = form.principalAmount && form.interestRate
    ? calcInterest(+form.principalAmount, +form.interestRate, 1) : 0;
  const payout = form.advanceInterestDeducted
    ? +form.principalAmount - advanceInterest : +form.principalAmount;

  const submit = async e => {
    e.preventDefault();
    if (!form.customer) return setError('Please select a customer');
    setError(''); setSaving(true);
    try {
      const payload = {
        ...form,
        principalAmount: +form.principalAmount,
        interestRate:    +form.interestRate,
        itemValue:       form.itemValue ? +form.itemValue : undefined,
        advanceInterestAmount: form.advanceInterestDeducted ? advanceInterest : 0,
        amountGivenToCustomer: payout
      };
      const { data } = await api.post('/loans', payload);
      navigate(`/loans/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create loan');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">New Loan Entry</h1>
        <p className="text-slate-500 text-sm">Register a new pawn transaction</p>
      </div>

      {error && <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

      <form onSubmit={submit} className="card p-6 space-y-5">
        {/* Customer */}
        <div>
          <label className="label">Customer *</label>
          <div className="relative">
            <input
              className="input" placeholder="Search by name or phone…"
              value={form.customer
                ? (customers.find(c => c._id === form.customer)?.name || '✓ Customer selected')
                : customerQ}
              onChange={e => { setCustomerQ(e.target.value); set('customer', ''); }}
            />
            {customers.length > 0 && !form.customer && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 overflow-hidden">
                {customers.map(c => (
                  <div key={c._id} onClick={() => { set('customer', c._id); setCustomerQ(c.name); setCustomers([]); }}
                    className="px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                    <div className="font-semibold text-slate-800 dark:text-white">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            New customer? <a href="/customers" className="text-gold-500 hover:underline">Add them first</a>
          </p>
        </div>

        {/* Item */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Item Type *</label>
            <select className="input" value={form.itemType} onChange={e => {
              const t = e.target.value;
              set('itemType', t);
              if (t === 'Gold')   set('interestRate', String(brand.goldRate));
              if (t === 'Silver') set('interestRate', String(brand.silverRate));
            }}>
              {['Gold','Silver','Diamond','Electronics','Vehicle','Other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Item Description *</label>
            <input className="input" required placeholder="e.g. Gold Ring 22K, Silver Anklet…"
              value={form.itemDescription} onChange={e => set('itemDescription', e.target.value)} />
          </div>
          <div>
            <label className="label">Item Weight</label>
            <input className="input" placeholder="e.g. 10g, 25g" value={form.itemWeight} onChange={e => set('itemWeight', e.target.value)} />
          </div>
          <div>
            <label className="label">Estimated Item Value (₹)</label>
            <input type="number" className="input" min="0" placeholder="Market value" value={form.itemValue} onChange={e => set('itemValue', e.target.value)} />
          </div>
        </div>

        {/* Loan Terms */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Loan Amount (₹) *</label>
            <input type="number" className="input" required min="1" placeholder="50000"
              value={form.principalAmount} onChange={e => set('principalAmount', e.target.value)} />
          </div>
          <div>
            <label className="label">Interest Rate (% / month) *</label>
            <input type="number" className="input" required min="0" step="0.1" placeholder="2"
              value={form.interestRate} onChange={e => set('interestRate', e.target.value)} />
          </div>
          <div>
            <label className="label">Pawn Date *</label>
            <input type="date" className="input" required value={form.pawnDate} onChange={e => set('pawnDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Expected Close Date</label>
            <input type="date" className="input" value={form.expectedCloseDate} onChange={e => set('expectedCloseDate', e.target.value)} />
          </div>
        </div>

        {/* Advance Deduction Toggle */}
        <label className="flex items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-gold-500 transition-all">
          <div>
            <div className="font-semibold text-sm">☑ Deduct First Month Interest Before Giving Loan</div>
            <div className="text-xs text-slate-400 mt-0.5">Interest deducted upfront from loan amount</div>
          </div>
          <div className="relative flex-shrink-0">
            <input type="checkbox" className="sr-only" checked={form.advanceInterestDeducted}
              onChange={e => set('advanceInterestDeducted', e.target.checked)} />
            <div className={`w-11 h-6 rounded-full transition-colors ${form.advanceInterestDeducted ? 'bg-gold-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 mx-0.5 transition-transform ${form.advanceInterestDeducted ? 'translate-x-5' : ''}`} />
            </div>
          </div>
        </label>

        {/* Live Payout Preview */}
        {form.principalAmount && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-center">
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">🏦 Loan Amount</div>
              <div className="text-xl font-black text-amber-700 dark:text-amber-400">{fmt(+form.principalAmount || 0)}</div>
            </div>
            {form.advanceInterestDeducted && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1">📉 Advance Deducted</div>
                <div className="text-xl font-black text-red-600 dark:text-red-400">−{fmt(advanceInterest)}</div>
              </div>
            )}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center">
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1">💵 Given to Customer</div>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">{fmt(payout)}</div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="label">Notes (optional)</label>
          <textarea className="input resize-none" rows={2} placeholder="Any additional information…"
            value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-gold flex-1">
            {saving ? 'Saving…' : '✅ Create Loan'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}
