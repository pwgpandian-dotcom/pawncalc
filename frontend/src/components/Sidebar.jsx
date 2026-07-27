import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { brand } from '../config/brand';

const NAV = [
  { to: '/',           icon: '▦',  label: 'Dashboard',    color: 'text-royal-300' },
  { to: '/loans/new',  icon: '+',  label: 'New Loan',     color: 'text-gold-400' },
  { to: '/loans',      icon: '◈',  label: 'Active Loans', color: 'text-blue-300' },
  { to: '/overdue',    icon: '⚠',  label: 'Overdue',      color: 'text-red-400' },
  { to: '/closed',     icon: '✓',  label: 'Closed Loans', color: 'text-forest-400' },
  { to: '/customers',  icon: '◎',  label: 'Customers',    color: 'text-purple-400' },
  { to: '/calculator', icon: '#',  label: 'Calculator',   color: 'text-gold-400' },
  { to: '/reports',    icon: '↗',  label: 'Reports',      color: 'text-royal-300' },
  { to: '/staff',      icon: '⊕',  label: 'Staff',        color: 'text-emerald-400', adminOnly: true },
];

export default function Sidebar({ open, onClose }) {
  const { logout, user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  // Each item is active only on its own route. Active Loans (/loans) also stays
  // active on a loan detail page (/loans/:id) — but never on /loans/new.
  const isItemActive = (to) => {
    if (to === '/loans') {
      return pathname === '/loans' || (pathname.startsWith('/loans/') && pathname !== '/loans/new');
    }
    return pathname === to;
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        bg-sb-gradient
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src={brand.logo} alt={brand.name}
              className="w-11 h-11 rounded-xl object-cover shadow-gold flex-shrink-0 border-2 border-gold-400/40" />
            <div className="min-w-0">
              <div className="text-white font-black text-sm font-display leading-tight truncate">
                {brand.name}
              </div>
              <div className="text-gold-400 font-bold text-[10px] tracking-widest uppercase leading-tight">
                {brand.tagline}
              </div>
            </div>
            <button onClick={onClose} className="ml-auto text-white/40 hover:text-white lg:hidden text-lg">✕</button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          <div className="px-3 mb-3">
            <span className="text-white/30 text-xs font-bold uppercase tracking-widest font-display">Menu</span>
          </div>
          {NAV.filter(({ adminOnly }) => !adminOnly || user?.role === 'admin').map(({ to, icon, label, color }) => {
            const isActive = isItemActive(to);
            return (
              <NavLink
                key={to} to={to} end
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                 ${isActive
                   ? 'bg-gold-gradient text-white shadow-gold'
                   : 'text-white/60 hover:text-white hover:bg-white/8'
                 }`}
              >
                <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm flex-shrink-0
                  ${isActive ? 'bg-white/20' : 'bg-white/8'}`}>
                  <span className={isActive ? 'text-white' : color}>{icon}</span>
                </span>
                <span className="font-display">{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-2">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/8 transition-all"
          >
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/8 text-sm">
              {theme === 'dark' ? '☀' : '☾'}
            </span>
            <span className="font-display font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="px-3 py-2.5 rounded-xl bg-white/8 border border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xs font-display">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-white text-sm font-semibold font-display truncate">{user?.name}</div>
                <div className="text-white/40 text-xs truncate">{user?.role}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-sm">⎋</span>
            <span className="font-display font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
