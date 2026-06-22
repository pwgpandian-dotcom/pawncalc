import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { fmt, fmtDate, calcMonths, calcSettlement } from '../utils/calculations';

export default function OverdueLoans() {
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/loans/overdue').then(r => setLoans(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔴</span>
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Overdue Loans</h1>
          <p className="text-red-500 text-sm font-semibold">{loans.length} loan{loans.length !== 1 ? 's' : ''} past expected close date</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading…</div>
      ) : loans.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <div className="font-bold text-slate-600 dark:text-slate-300">No overdue loans!</div>
          <div className="text-slate-400 text-sm mt-1">All loans are within expected close dates.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map(l => {
            const months     = calcMonths(l.pawnDate, new Date());
            const paidMonths = l.payments?.reduce((s, p) => s + (p.months || 0), 0) || 0;
            const settlement = calcSettlement(l.principalAmount, l.interestRate, months, paidMonths);
            const daysOverdue = Math.floor((new Date() - new Date(l.expectedCloseDate)) / (1000 * 60 * 60 * 24));

            return (
              <div key={l._id} className="card p-5 border-l-4 border-l-red-500">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-black text-gold-500">{l.loanNumber}</span>
                      <span className="badge-overdue">OVERDUE</span>
                      <span className="text-xs text-red-400 font-semibold">{daysOverdue} days past due</span>
                    </div>
                    <div className="font-bold text-slate-800 dark:text-white">{l.customer?.name}</div>
                    <div className="text-sm text-slate-400">{l.customer?.phone} · {l.itemDescription}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-slate-400 mb-0.5">Settlement today</div>
                    <div className="font-black text-xl text-red-500">{fmt(settlement.total)}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  {[
                    ['Principal', fmt(l.principalAmount), ''],
                    ['Rate', `${l.interestRate}%/mo`, ''],
                    ['Months Elapsed', `${months} mo`, 'text-amber-500'],
                    ['Paid Months', `${paidMonths} mo`, 'text-emerald-500'],
                    ['Pending Interest', fmt(settlement.interest), 'text-red-500'],
                  ].map(([label, val, cls]) => (
                    <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                      <div className="text-slate-400 mb-0.5">{label}</div>
                      <div className={`font-bold ${cls}`}>{val}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <Link to={`/loans/${l._id}`} className="btn-gold text-sm py-1.5 flex-1 text-center">View & Close Loan →</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
