import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';
import StatCard from '../components/StatCard';
import { fmt, fmtDate } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';

const QUICK = [
  { to: '/loans/new',  icon: '➕', label: 'New Loan',      desc: 'Register pawn transaction',  cls: 'from-royal-600 to-royal-800', shadow: 'shadow-blue' },
  { to: '/calculator', icon: '◈',  label: 'Calculator',    desc: 'Interest & settlement calc', cls: 'from-gold-500 to-gold-700',   shadow: 'shadow-gold' },
  { to: '/overdue',    icon: '⚠',  label: 'Overdue Loans', desc: null,                         cls: 'from-red-500 to-rose-600',    shadow: '' },
  { to: '/reports',    icon: '↗',  label: 'Reports',       desc: 'Export PDF & Excel',         cls: 'from-forest-500 to-forest-700', shadow: 'shadow-green' },
];

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [recent, setRecent]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/recent')])
      .then(([s, r]) => { setStats(s.data); setRecent(r.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4 max-w-7xl animate-pulse">
      <div className="h-16 skeleton rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 skeleton rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Welcome banner */}
      <div className="bg-sb-gradient rounded-2xl px-6 py-5 flex items-center justify-between shadow-blue overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-0 w-24 h-24 rounded-full bg-gold-500/10" />
        <div className="relative z-10">
          <h1 className="text-xl font-black text-white font-display">
            Good day, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-white/60 text-sm mt-0.5">Here's your business overview for today</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 relative z-10">
          <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center">
            <div className="text-white/50 text-xs font-display">Active</div>
            <div className="text-white font-black text-lg font-display leading-none">{stats.activeLoans}</div>
          </div>
          <div className="bg-gold-500/20 border border-gold-500/30 rounded-xl px-4 py-2 text-center">
            <div className="text-gold-300 text-xs font-display">Portfolio</div>
            <div className="text-gold-400 font-black text-sm font-display leading-none">{fmt(stats.activeAmount)}</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="◈" label="Active Loans"   value={stats.activeLoans}    sub={fmt(stats.activeAmount)}  color="blue" />
        <StatCard icon="⚠" label="Overdue"        value={stats.overdueLoans}   sub={fmt(stats.overdueAmount)} color="red" />
        <StatCard icon="✓" label="Closed Loans"   value={stats.closedLoans}    sub={fmt(stats.closedAmount)}  color="green" />
        <StatCard icon="◎" label="Customers"      value={stats.totalCustomers} sub="Total registered"         color="purple" />
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Bar Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-royal-900 dark:text-white font-display">Monthly Loan Closures</h2>
              <p className="text-slate-400 text-xs mt-0.5">Closed loans & amount collected per month</p>
            </div>
            <div className="bg-royal-50 dark:bg-royal-900/30 text-royal-600 dark:text-royal-300 text-xs font-bold px-3 py-1.5 rounded-lg font-display">
              Last 6 months
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthlyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e3a8a', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'Inter', fontSize: 13 }}
                formatter={v => [fmt(v), 'Amount']}
                cursor={{ fill: '#e0e7ff40' }}
              />
              <Bar dataKey="amount" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="font-black text-royal-900 dark:text-white font-display mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {QUICK.map(q => (
              <Link key={q.to} to={q.to}
                className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r ${q.cls} ${q.shadow}
                  hover:opacity-90 active:scale-95 transition-all duration-150 group`}
              >
                <span className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-lg text-white">
                  {q.icon}
                </span>
                <div>
                  <div className="font-bold text-white text-sm font-display">{q.label}</div>
                  {q.desc && <div className="text-white/60 text-xs">{q.desc}</div>}
                  {q.to === '/overdue' && (
                    <div className="text-white/60 text-xs">{stats.overdueLoans} loans overdue</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Loans */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-royal-50 dark:border-slate-800">
          <div>
            <h2 className="font-black text-royal-900 dark:text-white font-display">Recent Transactions</h2>
            <p className="text-slate-400 text-xs mt-0.5">Latest 10 loan entries</p>
          </div>
          <Link to="/loans"
            className="text-xs font-bold text-royal-600 hover:text-royal-800 bg-royal-50 hover:bg-royal-100 px-3 py-1.5 rounded-lg transition-all font-display">
            View all →
          </Link>
        </div>
        <div className="table-wrap border-0 rounded-t-none">
          <table>
            <thead><tr>
              <th>Loan #</th><th>Customer</th><th>Item</th>
              <th>Amount</th><th>Rate</th><th>Pawn Date</th><th>Status</th>
            </tr></thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">No loans yet. Create your first loan.</td></tr>
              ) : recent.map(l => (
                <tr key={l._id} className="cursor-pointer" onClick={() => window.location.href=`/loans/${l._id}`}>
                  <td><span className="font-mono font-bold text-royal-600 text-xs bg-royal-50 px-2 py-0.5 rounded-lg">{l.loanNumber}</span></td>
                  <td>
                    <div className="font-semibold text-slate-800 dark:text-white text-sm">{l.customer?.name}</div>
                    <div className="text-xs text-slate-400">{l.customer?.phone}</div>
                  </td>
                  <td className="text-slate-600 dark:text-slate-300 text-sm">{l.itemDescription}</td>
                  <td className="font-bold text-royal-800 dark:text-royal-300">{fmt(l.principalAmount)}</td>
                  <td className="text-slate-500 text-sm">{l.interestRate}%</td>
                  <td className="text-slate-500 text-sm">{fmtDate(l.pawnDate)}</td>
                  <td>
                    <span className={`badge-${l.status === 'active' ? 'active' : l.status === 'overdue' ? 'overdue' : 'closed'}`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
