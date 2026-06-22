import React, { useState } from 'react';
import api from '../api';
import { fmt, fmtDate } from '../utils/calculations';
import { printReport } from '../utils/print';

export default function Reports() {
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [status, setStatus]   = useState('');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to)   params.set('to', to);
      if (status) params.set('status', status);
      const r = await api.get(`/reports?${params}`);
      setData(r.data);
    } finally { setLoading(false); }
  };

  const exportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');
    const rows = data.loans.map(l => ({
      'Loan #':        l.loanNumber,
      'Customer':      l.customer?.name,
      'Phone':         l.customer?.phone,
      'Item':          l.itemDescription,
      'Principal':     l.principalAmount,
      'Rate %':        l.interestRate,
      'Pawn Date':     fmtDate(l.pawnDate),
      'Status':        l.status,
      'Closing Amt':   l.closingAmount || '',
      'Closed Date':   fmtDate(l.actualCloseDate)
    }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Loans');
    writeFile(wb, `pawncalc-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('⚖ PawnCalc — Loan Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 23);
    autoTable(doc, {
      startY: 28,
      head: [['Loan #','Customer','Item','Principal','Rate','Pawn Date','Status','Closing']],
      body: data.loans.map(l => [
        l.loanNumber, l.customer?.name, l.itemDescription,
        fmt(l.principalAmount), `${l.interestRate}%`,
        fmtDate(l.pawnDate), l.status, l.closingAmount ? fmt(l.closingAmount) : '—'
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [240, 180, 41] }
    });
    doc.save(`pawncalc-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-7xl space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white">📈 Reports</h1>
        <p className="text-slate-500 text-sm">Generate, export, and print loan reports</p>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <h2 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Report Filters</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">From Date</label>
            <input type="date" className="input w-auto" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" className="input w-auto" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button onClick={run} disabled={loading} className="btn-gold">
            {loading ? 'Loading…' : '🔍 Generate Report'}
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              ['Total Loans', data.summary.totalLoans, 'text-gold-500'],
              ['Principal', fmt(data.summary.totalPrincipal), 'text-amber-500'],
              ['Active', data.summary.totalActive, 'text-emerald-500'],
              ['Closed', data.summary.totalClosed, 'text-blue-400'],
              ['Recovered', fmt(data.summary.totalRecovered), 'text-blue-500'],
              ['Overdue', data.summary.totalOverdue, 'text-red-500'],
            ].map(([l,v,c]) => (
              <div key={l} className="card p-4 text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{l}</div>
                <div className={`text-lg font-black ${c}`}>{v}</div>
              </div>
            ))}
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => printReport(data.loans, data.summary, `${from||'All'} to ${to||'Now'}`)} className="btn-outline">🖨️ Print Report</button>
            <button onClick={exportExcel} className="btn-outline">📊 Export Excel</button>
            <button onClick={exportPDF} className="btn-outline">📄 Export PDF</button>
          </div>

          {/* Table */}
          <div className="card">
            <div className="table-wrap border-0">
              <table>
                <thead><tr>
                  <th>Loan #</th><th>Customer</th><th>Item</th>
                  <th>Principal</th><th>Rate</th><th>Pawn Date</th><th>Status</th><th>Closing</th>
                </tr></thead>
                <tbody>
                  {data.loans.map(l => (
                    <tr key={l._id}>
                      <td className="font-mono font-bold text-gold-500">{l.loanNumber}</td>
                      <td>
                        <div className="font-semibold">{l.customer?.name}</div>
                        <div className="text-xs text-slate-400">{l.customer?.phone}</div>
                      </td>
                      <td>{l.itemDescription}</td>
                      <td className="font-bold">{fmt(l.principalAmount)}</td>
                      <td>{l.interestRate}%</td>
                      <td className="text-slate-500">{fmtDate(l.pawnDate)}</td>
                      <td><span className={`badge-${l.status === 'active' ? 'active' : 'closed'}`}>{l.status}</span></td>
                      <td className="font-bold text-blue-500">{l.closingAmount ? fmt(l.closingAmount) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
