import React from 'react';

const THEMES = {
  blue:   { wrap: 'stat-blue',   icon: 'bg-white/20' },
  gold:   { wrap: 'stat-gold',   icon: 'bg-white/20' },
  green:  { wrap: 'stat-green',  icon: 'bg-white/20' },
  red:    { wrap: 'stat-red',    icon: 'bg-white/20' },
  purple: { wrap: 'stat-purple', icon: 'bg-white/20' },
};

export default function StatCard({ icon, label, value, sub, color = 'blue', trend }) {
  const t = THEMES[color] || THEMES.blue;
  return (
    <div className={`${t.wrap} rounded-2xl p-5 relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -right-1 -bottom-5 w-16 h-16 rounded-full bg-white/5" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-white/70 text-xs font-bold uppercase tracking-widest font-display mb-1.5 truncate">
            {label}
          </div>
          <div className="text-3xl font-black font-display text-white leading-none">{value}</div>
          {sub && (
            <div className="text-white/60 text-xs font-medium mt-1.5 truncate">{sub}</div>
          )}
          {trend !== undefined && (
            <div className={`text-xs font-semibold mt-1.5 ${trend >= 0 ? 'text-white/80' : 'text-red-200'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
        <div className={`${t.icon} w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
