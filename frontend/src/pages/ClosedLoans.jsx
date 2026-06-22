import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { fmt, fmtDate } from '../utils/calculations';

export default function ClosedLoans() {
  const [loans, setLoans]   = useState([]);
  const [q, setQ]           = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/loans?status=closed').then(r => setLoans(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = loans.filter(l => {
    if (!q) return true;
    const rx = new RegExp(q, 'i');
    return rx.test(l.loanNumber) || rx.test(l.customer?.name) || rx.test(l.itemDescription);
  });

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Closed Loans</h1>
        <p className="text-slate-500 text-sm">{loans.length} loan{loans.length !== 1 ? 's' : ''} closed</p>
      </div>

      <input className="input max-w-sm" placeholder="🔍 Search…" value={q} onChange={e => setQ(e.target.value)} />

      <div className="card">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No closed loans found.</div>
        ) : (
          <div className="table-wrap border-0">
            <table>
              <thead><tr>
                <th>Loan #</th><th>Customer</th><th>Item</th>
                <th>Principal</th><th>Closing Amount</th><th>Pawn Date</th><th>Closed On</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l._id}>
                    <td><span className="font-mono font-bold text-slate-500">{l.loanNumber}</span></td>
                    <td>
                      <div className="font-semibold">{l.customer?.name}</div>
                      <div className="text-xs text-slate-400">{l.customer?.phone}</div>
                    </td>
                    <td>{l.itemDescription}</td>
                    <td>{fmt(l.principalAmount)}</td>
                    <td className="font-black text-blue-500">{fmt(l.closingAmount)}</td>
                    <td className="text-slate-500">{fmtDate(l.pawnDate)}</td>
                    <td className="text-emerald-500">{fmtDate(l.actualCloseDate)}</td>
                    <td><Link to={`/loans/${l._id}`} className="text-gold-500 hover:underline text-sm font-semibold">View →</Link></td>
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
