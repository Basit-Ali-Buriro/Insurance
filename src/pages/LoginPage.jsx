import React, { useState } from 'react';
import api from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import logo from '../../assets/logo.svg';

export default function LoginPage({ onLogin }) {
  const toast = useToast();
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.login({ username: form.username.trim(), password: form.password });
      if (res.ok) {
        toast('Login successful. Welcome back!', 'success');
        onLogin(res.user);
      } else {
        setError(res.error || 'Invalid credentials, please try again.');
      }
    } catch {
      setError('Connection error. Please restart the application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-body-md text-on-surface flex items-center justify-center min-h-screen mesh-gradient relative font-['Outfit'] w-full overflow-hidden select-none">
      {/* Subtle Technical Background Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] rounded-full bg-electric-blue/10 blur-[100px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] rounded-full bg-royal-purple/10 blur-[100px]"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#ffffff08 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Login Container */}
      <main className="w-full max-w-[460px] px-md relative z-10 fade-in-up">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-5 mb-8 animate-float">
          <img src={logo} alt="Lalwani Logo" className="w-20 h-20 object-contain rounded-xl shadow-2xl shrink-0" />
          <div className="flex flex-col text-left">
            <h1 className="text-[36px] leading-tight text-on-surface tracking-wide glow-text font-bold font-['Outfit']">
              Lalwani
            </h1>
            <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-medium opacity-70 mt-1">
              Software Solutions
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-xl overflow-hidden p-8 relative">
          {/* Subtle accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-electric-blue/50 to-transparent"></div>
          
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Username Field */}
            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant/80 ml-1 uppercase tracking-wider" htmlFor="username">Operator Identity</label>
              <div className="relative group input-focus-glow transition-all duration-300 rounded-lg border border-black/10 bg-black/5 dark:border-white/10 dark:bg-black/40">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-electric-blue transition-colors text-[20px]">
                  account_circle
                </span>
                <input
                  className="w-full bg-transparent border-none py-[14px] pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 font-body-md text-sm outline-none"
                  id="username"
                  name="username"
                  placeholder="Enter identification"
                  required
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="font-label-sm text-label-sm text-on-surface-variant/80 uppercase tracking-wider" htmlFor="password">Security Key</label>
              </div>
              <div className="relative group input-focus-glow transition-all duration-300 rounded-lg border border-black/10 bg-black/5 dark:border-white/10 dark:bg-black/40">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-electric-blue transition-colors text-[20px]">
                  encrypted
                </span>
                <input
                  className="w-full bg-transparent border-none py-[14px] pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 font-body-md text-sm outline-none"
                  id="password"
                  name="password"
                  placeholder="Enter secure key"
                  required
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  aria-label="Toggle password visibility"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors focus:outline-none"
                  onClick={() => setShowPwd(v => !v)}
                  type="button"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPwd ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded bg-error/10 border border-error/20 text-xs font-semibold text-error">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Primary Action */}
            <button
              className="w-full premium-btn text-white font-semibold py-[14px] rounded-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2 group uppercase tracking-widest text-sm"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Authorizing Session...</span>
                </>
              ) : (
                <>
                  <span>Authorize Access</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Legal/System Note */}
        <footer className="mt-8 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-black/5 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-black/5 dark:border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-green animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant/80 uppercase tracking-widest">Hardware-bound Enterprise License: Active</span>
          </div>
          <div className="flex justify-center items-center space-x-4 opacity-30">
            <span className="font-label-sm text-[10px] uppercase tracking-[0.2em]">AES-256 Protocol</span>
            <span className="w-1 h-1 rounded-full bg-black/50 dark:bg-white/50"></span>
            <span className="font-label-sm text-[10px] uppercase tracking-[0.2em]">Secure Node Stable</span>
          </div>
          <div className="text-[9px] text-on-surface-variant/40 uppercase tracking-widest font-bold pt-1">
            © 2026 Lalwani Software Solutions.
          </div>
        </footer>
      </main>

      {/* UI Background Texture Detail (Top Left) */}
      <div className="fixed top-8 left-8 pointer-events-none opacity-20 hidden md:block">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="w-1.5 h-1.5 bg-black/80 dark:bg-white/80"></div>
          <div className="w-1.5 h-1.5 bg-black/40 dark:bg-white/40"></div>
          <div className="w-1.5 h-1.5 bg-black/40 dark:bg-white/40"></div>
          <div className="w-1.5 h-1.5 border border-black/60 dark:border-white/60"></div>
        </div>
        <p className="font-label-sm text-[10px] mt-4 tracking-[0.3em] uppercase text-on-surface-variant">LSS Management v1</p>
      </div>

      {/* UI Background Texture Detail (Bottom Right) */}
      <div className="fixed bottom-8 right-8 pointer-events-none opacity-20 text-right hidden md:block">
        <p className="font-label-sm text-[10px] mb-4 tracking-[0.3em] uppercase text-on-surface-variant">Secure Data Node</p>
        <div className="flex justify-end space-x-1.5">
          <div className="w-6 h-[1.5px] bg-black/20 dark:bg-white/20"></div>
          <div className="w-16 h-[1.5px] bg-electric-blue"></div>
        </div>
      </div>
    </div>
  );
}
