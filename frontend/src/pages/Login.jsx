import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { brand } from '../config/brand';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left — Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sb-gradient flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute w-96 h-96 rounded-full bg-white/5 -top-20 -left-20" />
        <div className="absolute w-64 h-64 rounded-full bg-gold-500/10 bottom-10 right-10" />
        <div className="absolute w-32 h-32 rounded-full bg-royal-400/20 top-1/2 left-10" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="w-24 h-24 rounded-2xl shadow-gold mx-auto mb-6 overflow-hidden border-2 border-gold-400/40">
            <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-black text-white font-display leading-tight mb-1">
            {brand.name}
          </h1>
          <p className="text-gold-300 text-sm font-bold mb-3">{brand.taglineAlt}</p>
          <p className="text-white/60 text-base leading-relaxed">
            Premium Pawn Finance Management System
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Security', icon: '🔒' },
              { label: 'Fast', icon: '⚡' },
              { label: 'Reliable', icon: '✦' },
            ].map(f => (
              <div key={f.label} className="bg-white/8 border border-white/10 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{f.icon}</div>
                <div className="text-white/60 text-xs font-semibold font-display">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-sb-bg dark:bg-slate-950">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-gold border-2 border-gold-400/30">
              <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-black text-royal-900 dark:text-white font-display text-lg leading-none">{brand.name}</div>
              <div className="text-gold-500 font-bold text-xs leading-none mt-0.5">{brand.tagline}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card-lg border border-royal-100 dark:border-slate-800 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-black text-royal-900 dark:text-white font-display">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email" inputMode="email" autoComplete="username" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password" autoComplete="current-password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••••"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="btn-primary w-full py-3 text-base disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>🔐 Sign In</>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-400 text-xs mt-5">
            {brand.name} © {new Date().getFullYear()} — Secure Finance Platform
          </p>
        </div>
      </div>

    </div>
  );
}
