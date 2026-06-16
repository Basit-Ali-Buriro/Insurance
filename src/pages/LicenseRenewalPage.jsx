import React, { useState } from 'react';
import api from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';

export default function LicenseRenewalPage({ onRenewed }) {
  const toast   = useToast();
  const [key,     setKey]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim()) { setError('Please enter the activation key.'); return; }
    setLoading(true);
    setError('');
    try {
      const ok = await api.licenseRenew(key.trim());
      if (ok) {
        toast('License renewed successfully. Welcome back!', 'success');
        onRenewed();
      } else {
        setError('Invalid Key. Please contact your software provider.');
      }
    } catch {
      setError('An error occurred. Please restart and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#020617] relative overflow-hidden w-full select-none">
      {/* Background Atmospheric Effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px]" style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(239, 68, 68, 0.08) 0%, transparent 70%)'
        }}></div>
      </div>

      {/* Renewal Container */}
      <main className="relative z-10 w-full max-w-[400px] flex flex-col items-center">
        {/* Logo & Branding */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-error/10 border border-error/20 shadow-inner">
            <span className="material-symbols-outlined text-error text-[38px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">License Expired</h1>
          <p className="font-body-md text-xs text-error tracking-wider uppercase">Immediate Activation Required</p>
        </div>

        {/* Card */}
        <div className="w-full p-8 rounded-xl border border-border-subtle bg-surface-container-low/75 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Subtle internal light line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-surface-variant block uppercase tracking-wider" htmlFor="renewal-key">Activation Key</label>
              <input
                id="renewal-key"
                type="text"
                className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-mono text-sm tracking-wider"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={key}
                onChange={e => { setKey(e.target.value); setError(''); }}
                disabled={loading}
                autoFocus
              />
              <p className="text-[11px] text-outline italic leading-tight">
                Please contact your software provider to procure a renewal activation key for this machine fingerprint.
              </p>
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
              className="w-full mt-4 bg-error text-white font-bold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 uppercase tracking-widest shadow-lg shadow-error/10 text-sm"
              id="submitBtn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Validating Key…</span>
                </>
              ) : (
                <span>Activate License</span>
              )}
            </button>
          </form>
        </div>

        {/* System Status Footer */}
        <div className="mt-8 flex items-center space-x-3 text-xs text-on-surface-variant font-medium select-none">
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></div>
            <span className="text-error">Terminal Locked</span>
          </div>
          <span className="text-border-subtle">•</span>
          <span>v1.0.0-SEC</span>
        </div>
      </main>
    </div>
  );
}

