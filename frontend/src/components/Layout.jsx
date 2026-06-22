import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { brand } from '../config/brand';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-sb-bg dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex items-center justify-between px-5 py-3.5
          bg-white dark:bg-slate-900 border-b border-royal-100 dark:border-slate-800
          shadow-sm flex-shrink-0">

          <div className="flex items-center gap-3">
            {/* Hamburger — mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl
                bg-royal-50 text-royal-700 hover:bg-royal-100 transition-all"
            >
              <span className="text-lg font-bold">☰</span>
            </button>

            {/* Brand — mobile only */}
            <div className="lg:hidden flex items-center gap-2">
              <img src={brand.logo} alt={brand.name} className="w-8 h-8 rounded-lg object-cover border border-gold-400/30" />
              <div>
                <div className="font-black text-royal-900 dark:text-white text-xs font-display leading-none">{brand.name}</div>
                <div className="text-gold-500 text-[9px] font-bold leading-none mt-0.5">{brand.tagline}</div>
              </div>
            </div>

            {/* Page breadcrumb — desktop */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-slate-400">
              <span className="text-royal-600 font-semibold font-display">{brand.name}</span>
              <span>/</span>
              <span className="text-slate-500">Finance Management</span>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Notification badge */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl
              bg-royal-50 dark:bg-slate-800 text-royal-600 dark:text-slate-300
              hover:bg-royal-100 dark:hover:bg-slate-700 transition-all">
              <span className="text-base">🔔</span>
            </button>

            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl
              bg-royal-50 dark:bg-slate-800 border border-royal-100 dark:border-slate-700">
              <div className="w-6 h-6 rounded-lg bg-gold-gradient flex items-center justify-center">
                <span className="text-white font-black text-xs font-display">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-royal-900 dark:text-white font-display leading-none">{user?.name}</div>
                <div className="text-xs text-slate-400 capitalize leading-none mt-0.5">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
