import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { fmt, fmtDate, calcMonths, calcSettlement } from '../utils/calculations';
import { printLoanReceipt } from '../utils/print';

export default function LoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [payForm, setPayForm] = useState({ months: 1, amount: '', paidDate: new Date().toISOString().split('T')[0], notes: '' });
  const [closeDate, setCloseDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const load = () => api.get(`/loans/${id}`).then(r => setLoan(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading…</div>;
  if (!loan) return <div className="text-center py-20 text-red-400">Loan not found</div>;

  const monthsElapsed = calcMonths(loan.pawnDate, loan.actualCloseDate || new Date());
  const paidMonths    = loan.payments.reduce((s, p) => s + (p.months || 0), 0);
  const settlement    = calcSettlement(loan.principalAmount, loan.interestRate, monthsElapsed, paidMonths);

  const addPayment = async () => {
    setSaving(true);
    try {
      const r = await api.post(`/loans/${id}/payments`, { ...payForm, amount: +payForm.amount, months: +payForm.months });
      setLoan(r.data); setPayModal(false);
    } finally { setSaving(false); }
  };

  const closeLoan = async () => {
    setSaving(true);
    try {
      const r = await api.patch(`/loans/${id}/close`, { actualCloseDate: closeDate, closingAmount: settlement.total });
      setLoan(r.data); setCloseModal(false);
    } finally { setSaving(false); }
  };

  const isActive = loan.status === 'active';

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back + Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm">← Back</button>
        <h1 className="text-xl font-black text-slate-800 dark:text-white font-mono">{loan.loanNumber}</h1>
        <span className={`badge-${loan.status === 'active' ? 'active' : loan.status === 'overdue' ? 'overdue' : 'closed'}`}>
          {loan.status.toUpperCase()}
        </span>
        <div className="ml-auto flex gap-2 flex-wrap">
          <button onClick={() => printLoanReceipt(loan)} className="btn-outline text-sm py-1.5">🖨️ Print</button>
          {isActive && <button onClick={() => setPayModal(true)} className="btn-outline text-sm py-1.5">💰 Add Payment</button>}
          {isActive && <button onClick={() => setCloseModal(true)} className="btn-gold text-sm py-1.5">🔒 Close Loan</button>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Customer & Loan Info */}
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider">Customer</h2>
          <Link to={`/customers`} className="text-xl font-black text-gold-500 hover:underline">{loan.customer?.name}</Link>
          <div className="text-slate-500">{loan.customer?.phone}</div>
          <div className="text-sm text-slate-400">{loan.customer?.address}</div>
        </div>

        <div className="card p-5 space-y-2">
          <h2 className="font-bold text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider">Item Pledged</h2>
          <div className="font-bold text-slate-800 dark:text-white">{loan.itemDescription}</div>
          {loan.itemWeight && <div className="text-sm text-slate-400">Weight: {loan.itemWeight}</div>}
          {loan.itemValue   && <div className="text-sm text-slate-400">Est. Value: {fmt(loan.itemValue)}</div>}
        </div>
      </div>

      {/* Loan Terms */}
      <div className="card p-5">
        <h2 className="font-bold text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider mb-4">Loan Terms</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ['Principal', fmt(loan.principalAmount)],
            ['Interest Rate', `${loan.interestRate}% / month`],
            ['Pawn Date', fmtDate(loan.pawnDate)],
            ['Expected Close', fmtDate(loan.expectedCloseDate)],
          ].map(([l, v]) => (
            <div key={l} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{l}</div>
              <div className="font-bold text-slate-800 dark:text-white text-sm">{v}</div>
            </div>
          ))}
        </div>
        {loan.advanceInterestDeducted && (
          <div className="mt-3 flex gap-3">
            <div className="flex-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-3">
              <div className="text-xs text-red-500 uppercase mb-1">📉 Advance Interest Deducted</div>
              <div className="font-black text-red-600 dark:text-red-400">{fmt(loan.advanceInterestAmount)}</div>
            </div>
            <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3">
              <div className="text-xs text-emerald-600 uppercase mb-1">💵 Amount Given to Customer</div>
              <div className="font-black text-emerald-600 dark:text-emerald-400">{fmt(loan.amountGivenToCustomer)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Settlement Summary */}
      {isActive && (
        <div className="card p-5">
          <h2 className="font-bold text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider mb-4">Current Settlement (as of today)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">Total Months</div>
              <div className="font-black text-lg">{monthsElapsed}</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 text-center">
              <div className="text-xs text-emerald-600 mb-1">Paid Months</div>
              <div className="font-black text-lg text-emerald-600">{paidMonths}</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3 text-center">
              <div className="text-xs text-amber-600 mb-1">Pending Months</div>
              <div className="font-black text-lg text-amber-600">{settlement.pending}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-3 text-center">
              <div className="text-xs text-red-500 mb-1">Pending Interest</div>
              <div className="font-black text-lg text-red-500">{fmt(settlement.interest)}</div>
            </div>
          </div>
          <div className="mt-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 flex justify-between items-center">
            <div className="font-bold text-blue-600 dark:text-blue-400">💰 Settlement Amount</div>
            <div className="font-black text-2xl text-blue-600 dark:text-blue-400">{fmt(settlement.total)}</div>
          </div>
        </div>
      )}

      {loan.status === 'closed' && (
        <div className="card p-5">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-slate-400 mb-1">Closed on {fmtDate(loan.actualCloseDate)}</div>
              <div className="font-bold text-slate-600 dark:text-slate-300">Final Closing Amount</div>
            </div>
            <div className="font-black text-2xl text-blue-500">{fmt(loan.closingAmount)}</div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="card">
        <div className="px-5 pt-5 pb-3 font-bold text-slate-700 dark:text-slate-200">💳 Interest Payment History</div>
        {loan.payments.length === 0 ? (
          <div className="px-5 pb-5 text-slate-400 text-sm">No payments recorded yet.</div>
        ) : (
          <div className="table-wrap rounded-t-none border-0 border-t border-slate-200 dark:border-slate-800">
            <table>
              <thead><tr><th>Date</th><th>Months Covered</th><th>Amount Paid</th><th>Notes</th></tr></thead>
              <tbody>
                {loan.payments.map((p, i) => (
                  <tr key={i}>
                    <td>{fmtDate(p.paidDate)}</td>
                    <td><span className="badge-active">{p.months} Month{p.months !== 1 ? 's' : ''}</span></td>
                    <td className="font-bold text-emerald-500">{fmt(p.amount)}</td>
                    <td className="text-slate-400">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {payModal && (
        <Modal title="💰 Record Interest Payment" onClose={() => setPayModal(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Months Covered</label>
                <input type="number" className="input" min="1" value={payForm.months}
                  onChange={e => setPayForm(f => ({ ...f, months: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Amount Paid (₹)</label>
                <input type="number" className="input" min="0" value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Payment Date</label>
              <input type="date" className="input" value={payForm.paidDate}
                onChange={e => setPayForm(f => ({ ...f, paidDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input className="input" placeholder="Optional" value={payForm.notes}
                onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 text-sm">
              Expected: {fmt(loan.principalAmount * (loan.interestRate / 100) * (payForm.months || 1))} for {payForm.months} month(s)
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addPayment} disabled={saving} className="btn-gold flex-1">{saving ? 'Saving…' : 'Save Payment'}</button>
              <button onClick={() => setPayModal(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Close Loan Modal */}
      {closeModal && (
        <Modal title="🔒 Close Loan" onClose={() => setCloseModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="label">Closing Date</label>
              <input type="date" className="input" value={closeDate} onChange={e => setCloseDate(e.target.value)} />
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-400">Principal</span><span className="font-bold">{fmt(loan.principalAmount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Pending Interest ({settlement.pending} mo.)</span><span className="font-bold text-red-400">{fmt(settlement.interest)}</span></div>
              <div className="flex justify-between font-black text-lg border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
                <span>Settlement</span><span className="text-blue-400">{fmt(settlement.total)}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={closeLoan} disabled={saving} className="btn-gold flex-1">{saving ? 'Closing…' : '✅ Confirm Close'}</button>
              <button onClick={() => setCloseModal(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
