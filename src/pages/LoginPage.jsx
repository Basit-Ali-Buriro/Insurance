import React, { useState } from 'react';
import api from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';

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
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#020617] relative overflow-hidden w-full select-none">
      {/* Background Atmospheric Effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px]" style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(77, 142, 255, 0.08) 0%, transparent 70%)'
        }}></div>
      </div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-[400px] flex flex-col items-center">
        {/* Logo & Branding */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-primary-container/10 border border-primary/20 shadow-inner">
            <span className="material-symbols-outlined text-primary text-[38px] select-none" style={{ fontVariationSettings: "'FILL' 0" }}>shield_lock</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Sentinel Insure</h1>
          <p className="font-body-md text-xs text-on-surface-variant tracking-wider uppercase opacity-75">Enterprise ERP Portal</p>
        </div>

        {/* Card */}
        <div className="w-full p-8 rounded-xl border border-border-subtle bg-surface-container-low/75 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Subtle internal light line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider" htmlFor="username">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <input
                  className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 pl-11 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm"
                  id="username"
                  name="username"
                  placeholder="admin_username"
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
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider" htmlFor="password">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 pl-11 pr-11 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm"
                  id="password"
                  name="password"
                  placeholder="••••••••••••"
                  required
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                />
                <button
                  aria-label="Toggle password visibility"
                  className="absolute inset-y-0 right-3 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
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

            {/* Submit Button */}
            <button
              className="w-full mt-4 bg-primary text-on-primary font-bold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 uppercase tracking-widest shadow-lg shadow-primary/10 text-sm"
              id="submitBtn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-on-primary border-t-transparent rounded-full" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <span>Secure Login</span>
              )}
            </button>
          </form>

          {/* Security Badges */}
          <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-center space-x-4 opacity-50 select-none">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[20px] mb-1">security</span>
              <span className="font-label-caps text-[8px] uppercase tracking-wider text-outline">Terminal Secure</span>
            </div>
            <div className="h-4 w-[1px] bg-border-subtle"></div>
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[20px] mb-1">encrypted</span>
              <span className="font-label-caps text-[8px] uppercase tracking-wider text-outline">AES-256 Encrypted</span>
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="mt-8 flex items-center space-x-3 text-xs text-on-surface-variant font-medium select-none">
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
            <span>Terminal Online</span>
          </div>
          <span className="text-border-subtle">•</span>
          <span>v1.0.0-SEC</span>
        </div>
      </main>
    </div>
  );
}

