import React, { useState } from 'react';
import api from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';
import logo from '../../assets/logo.svg';

export default function LicenseRenewalPage({ onRenewed, licenseInfo }) {
  const toast   = useToast();
  const [key,     setKey]     = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const machineIdVal = licenseInfo?.machineId || 'FETCHING-MACHINE-ID...';

  const handleCopy = () => {
    navigator.clipboard.writeText(machineIdVal);
    toast('Machine ID copied to clipboard!', 'success');
  };

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
    <div className="font-body-md text-on-surface flex items-center justify-center min-h-screen relative overflow-hidden bg-deep-charcoal w-full select-none selection:bg-electric-blue selection:text-white font-['Outfit']">
      {/* Background Layer with Shaders */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-deep-charcoal via-transparent to-electric-blue/10"></div>
        <div className="absolute inset-0 animate-pulse-slow bg-[radial-gradient(circle_at_50%_50%,rgba(0,122,255,0.1),transparent_70%)]"></div>
      </div>

      {/* Main Lock Canvas */}
      <main className="relative z-10 w-full max-w-[540px] px-4">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Lalwani Logo" className="w-28 h-28 mb-4 object-contain rounded-lg shadow-2xl" />
          <h1 className="text-headline-md text-on-surface font-bold tracking-wider font-['Outfit']">Lalwani</h1>
          <p className="text-label-caps text-on-surface-variant mt-1 uppercase tracking-[0.2em] font-medium">Software Solutions</p>
        </div>

        {/* Glassmorphism Container */}
        <div className="glass-panel rounded-xl p-8 shadow-2xl relative overflow-hidden">
          {/* Alert Header */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-electric-blue/10 border border-electric-blue/20 rounded-lg">
            <span className="material-symbols-outlined text-electric-blue" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div>
              <h2 className="text-headline-md text-on-surface leading-tight font-bold">License Expired</h2>
              <p className="text-body-md text-xs text-on-surface-variant">System-wide lock initiated due to subscription lapse.</p>
            </div>
          </div>

          {/* Machine Context */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-on-surface-variant">Unique Machine ID</span>
              <button 
                type="button" 
                className="flex items-center gap-1 text-xs font-semibold text-electric-blue hover:text-primary-container transition-colors focus:outline-none" 
                onClick={handleCopy}
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span>COPY</span>
              </button>
            </div>
            <div className="bg-deep-charcoal/80 border border-outline-variant p-4 rounded-lg font-mono text-xs text-primary tracking-wider flex justify-between items-center select-all">
              <span>{machineIdVal}</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">fingerprint</span>
            </div>
          </div>

          {/* Renewal Form */}
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant ml-1" htmlFor="license-key">Renewal Key</label>
              <div className="relative group">
                <input
                  className="w-full h-14 bg-deep-charcoal border border-outline-variant rounded-lg px-4 pr-12 font-mono text-body-lg text-on-surface focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-all placeholder:text-outline-variant"
                  id="license-key"
                  placeholder="Enter or paste activation key..."
                  required
                  type="text"
                  value={key}
                  onChange={e => { setKey(e.target.value); setError(''); }}
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-outline-variant group-focus-within:text-electric-blue pointer-events-none">
                  <span className="material-symbols-outlined">vpn_key</span>
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant/70 ml-1 italic">
                Contact your account manager if you have not received your new key.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded bg-error/10 border border-error/20 text-xs font-semibold text-error">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                className="w-full h-14 bg-gradient-to-r from-electric-blue to-royal-purple hover:brightness-110 text-white font-semibold rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group text-sm uppercase tracking-wider"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Verifying License Key...</span>
                  </>
                ) : (
                  <>
                    <span>ACTIVATE SYSTEM LICENSE</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">bolt</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="mt-8 pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button 
              className="text-xs font-semibold text-on-surface-variant hover:text-electric-blue transition-colors flex items-center gap-1 group bg-transparent border-none cursor-pointer" 
              onClick={() => {
                const msg = `Assalam o Alaikum Developer, please activate my license. My Machine ID is: ${machineIdVal}`;
                api.openWhatsAppAlert(msg);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">support_agent</span>
              <span>Contact Developer Support</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse"></div>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Locked State</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-6 text-center text-xs text-on-surface-variant/40 px-6">
          This instance of Lalwani Software Solutions is protected by hardware-bound encryption. Unauthorized attempts to bypass this screen will be logged and reported to the system administrator.
        </p>

        {/* Dynamic Visual Detail */}
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-electric-blue/5 blur-[120px] rounded-full pointer-events-none"></div>
      </main>
    </div>
  );
}
