import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { fmt, calcInterest, autoInterestRate } from '../utils/calculations';

const today = () => new Date().toISOString().split('T')[0];
const onlyDigits = (v, max) => v.replace(/\D/g, '').slice(0, max);

export default function NewLoan() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    customerName: '', customerPhone: '', village: '',
    loanNumber: '',
    itemType: 'Gold', itemDescription: '', itemWeight: '', itemValue: '',
    principalAmount: '', interestRate: '', pawnDate: today(),
    expectedCloseDate: '', advanceInterestDeducted: false, notes: ''
  });
  const [rateEdited, setRateEdited] = useState(false);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  // Prefill the next loan number (continues the sequence). null = admin enters the first one.
  useEffect(() => {
    api.get('/loans/next-number')
      .then(r => { if (r.data.next) setForm(f => ({ ...f, loanNumber: String(r.data.next) })); })
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto interest rule: below ₹10,000 → 2.5%, otherwise 2% — unless the user edited it.
  const setPrincipal = (v) => {
    setForm(f => {
      const next = { ...f, principalAmount: v };
      if (!rateEdited && v !== '') next.interestRate = String(autoInterestRate(+v));
      return next;
    });
  };

  const advanceInterest = form.principalAmount && form.interestRate
    ? calcInterest(+form.principalAmount, +form.interestRate, 1) : 0;
  const payout = form.advanceInterestDeducted
    ? +form.principalAmount - advanceInterest : +form.principalAmount;

  const submit = async e => {
    e.preventDefault();
    if (!form.customerName.trim())            return setError('Customer name is required');
    if (!/^[0-9]{10}$/.test(form.customerPhone)) return setError('Mobile number must be exactly 10 digits');
    if (!form.loanNumber.trim())              return setError('Loan number is required');
    setError(''); setSaving(true);
    try {
      const payload = {
        loanNumber: form.loanNumber.trim(),
        customerData: {
          name:    form.customerName.trim(),
          phone:   form.customerPhone.trim(),
          village: form.village.trim()
        },
        itemType: form.itemType,
        itemDescription: form.itemDescription,
        itemWeight: form.itemWeight,
        itemValue: form.itemValue ? +form.itemValue : undefined,
        principalAmount: +form.principalAmount,
        interestRate:    +form.interestRate,
        pawnDate: form.pawnDate,
        expectedCloseDate: form.expectedCloseDate || undefined,
        advanceInterestDeducted: form.advanceInterestDeducted,
        advanceInterestAmount: form.advanceInterestDeducted ? advanceInterest : 0,
        amountGivenToCustomer: payout,
        notes: form.notes
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
        {/* Customer — entered directly, no need to visit the Customers page */}
        <div>
          <h2 className="font-bold text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider mb-3">Customer Details</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Customer Name *</label>
              <input type="text" autoComplete="name" className="input" required placeholder="Full name"
                value={form.customerName} onChange={e => set('customerName', e.target.value)} />
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <input type="tel" inputMode="numeric" pattern="[0-9]*" autoComplete="tel" maxLength={10}
                className="input" required placeholder="10-digit mobile"
                value={form.customerPhone} onChange={e => set('customerPhone', onlyDigits(e.target.value, 10))} />
            </div>
            <div>
              <label className="label">Village Name</label>
              <input type="text" autoComplete="address-level3" className="input" placeholder="Recommended"
                value={form.village} onChange={e => set('village', e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            If this mobile number already exists, the existing customer is used automatically — no duplicates.
          </p>
        </div>

        {/* Loan Number */}
        <div>
          <label className="label">Loan Number *</label>
          <input className="input font-mono" required inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 1001"
            value={form.loanNumber} onChange={e => set('loanNumber', onlyDigits(e.target.value, 12))} />
          <p className="text-xs text-slate-400 mt-1">Auto-continues the sequence. Edit only to start a new series.</p>
        </div>

        {/* Item */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Item Type *</label>
            <select className="input" value={form.itemType} onChange={e => set('itemType', e.target.value)}>
              {['Gold','Silver','Diamond','Electronics','Vehicle','Other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Item Description *</label>
            <input type="text" className="input" required placeholder="e.g. Gold Ring 22K, Silver Anklet…"
              value={form.itemDescription} onChange={e => set('itemDescription', e.target.value)} />
          </div>
          <div>
            <label className="label">Item Weight</label>
            <input inputMode="decimal" className="input" placeholder="e.g. 10, 25.5" value={form.itemWeight} onChange={e => set('itemWeight', e.target.value)} />
          </div>
          <div>
            <label className="label">Estimated Item Value (₹)</label>
            <input type="number" inputMode="numeric" className="input" min="0" placeholder="Market value" value={form.itemValue} onChange={e => set('itemValue', e.target.value)} />
          </div>
        </div>

        {/* Loan Terms */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Loan Amount (₹) *</label>
            <input type="number" inputMode="numeric" className="input" required min="1" placeholder="50000"
              value={form.principalAmount} onChange={e => setPrincipal(e.target.value)} />
          </div>
          <div>
            <label className="label">Interest Rate (% / month) *</label>
            <input type="number" inputMode="decimal" className="input" required min="0" step="0.1" placeholder="2"
              value={form.interestRate}
              onChange={e => { setRateEdited(true); set('interestRate', e.target.value); }} />
            <p className="text-xs text-slate-400 mt-1">Auto: 2.5% below ₹10,000, else 2%. Editable.</p>
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
