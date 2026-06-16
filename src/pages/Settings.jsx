import React, { useState } from 'react';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';
import { ConfirmDialog } from '../components/Modal.jsx';

export default function Settings({ user, onProfileUpdate }) {
  const toast = useToast();
  const [profile,   setProfile]   = useState({ name: user?.name || '', username: user?.username || '' });
  const [pwdForm,   setPwdForm]   = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [savingP,   setSavingP]   = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdErrors, setPwdErrors] = useState({});
  const [showPwd,   setShowPwd]   = useState({ curr:false, new:false, confirm:false });

  const handleSaveProfile = async () => {
    if (!profile.name.trim() || !profile.username.trim()) {
      toast('Name and username are required','error'); return;
    }
    setSavingP(true);
    try {
      const res = await api.updateProfile({ id: user.id, name: profile.name.trim(), username: profile.username.trim() });
      if (res.ok) {
        toast('Profile updated successfully','success');
        onProfileUpdate?.({ name: profile.name.trim(), username: profile.username.trim() });
      } else toast(res.error || 'Update failed','error');
    } finally { setSavingP(false); }
  };

  const handleChangePassword = async () => {
    const e = {};
    if (!pwdForm.currentPassword)   e.currentPassword   = 'Required';
    if (!pwdForm.newPassword)        e.newPassword        = 'Required';
    if (pwdForm.newPassword.length < 6) e.newPassword    = 'Minimum 6 characters';
    if (pwdForm.newPassword !== pwdForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (Object.keys(e).length) { setPwdErrors(e); return; }
    setSavingPwd(true);
    try {
      const res = await api.changePassword({ id: user.id, currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      if (res.ok) {
        toast('Password changed successfully','success');
        setPwdForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
        setPwdErrors({});
      } else {
        toast(res.error || 'Failed to change password','error');
      }
    } finally { setSavingPwd(false); }
  };

  const toggle = (k) => setShowPwd(v => ({ ...v, [k]: !v[k] }));
  const setPwd = (k, v) => { setPwdForm(f=>({...f,[k]:v})); setPwdErrors(e=>({...e,[k]:undefined})); };

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    toast(`${newTheme === 'light' ? 'Arctic Light' : 'Sentinel Dark'} theme applied`, 'success');
  };

  const handleConfirmReset = async () => {
    setShowResetConfirm(false);
    try {
      const res = await api.resetDatabase();
      if (res.ok) {
        toast('Database cleared successfully!', 'success');
      } else {
        toast(res.error || 'Database reset failed', 'error');
      }
    } catch {
      toast('Failed to clear database', 'error');
    }
  };

  const handleConfirmSeed = async () => {
    setShowSeedConfirm(false);
    try {
      const res = await api.seedDatabase();
      if (res.ok) {
        toast('Database seeded with sample data successfully!', 'success');
      } else {
        toast(res.error || 'Database seeding failed', 'error');
      }
    } catch {
      toast('Failed to seed database', 'error');
    }
  };

  // Generate initials for avatar fallback
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'US';

  return (
    <div className="space-y-6 select-none">
      {/* Bento Grid Layout for Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Management (Col 8) */}
        <div className="lg:col-span-8 bg-surface-bright border border-border-subtle rounded-xl flex flex-col shadow-sm">
          <div className="h-12 px-6 flex items-center justify-between border-b border-border-subtle bg-surface-container-high/30">
            <span className="text-label-caps font-label-caps text-primary uppercase tracking-wider font-bold">Profile Management</span>
            <span className="material-symbols-outlined text-outline text-[20px]">badge</span>
          </div>
          
          <div className="p-6 flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-primary-container/20 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-2xl">
                  {initials}
                </div>
              </div>
              <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Terminal Profile</p>
            </div>

            {/* Form Section */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Display Name</label>
                  <input
                    id="settings-name"
                    className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all font-body-md text-sm"
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Username</label>
                  <input
                    id="settings-username"
                    className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all font-body-md text-sm"
                    type="text"
                    value={profile.username}
                    onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Terminal Role:</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  user?.role === 'developer' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-surface-container-low border-t border-border-subtle flex justify-end">
            <button
              id="btn-save-profile"
              className="px-5 py-2 bg-primary text-on-primary font-bold rounded-lg font-body-md text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all outline-none"
              onClick={handleSaveProfile}
              disabled={savingP}
            >
              {savingP ? 'Saving Profile…' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Change Password (Col 4) */}
        <div className="lg:col-span-4 bg-surface-bright border border-border-subtle rounded-xl flex flex-col shadow-sm">
          <div className="h-12 px-6 flex items-center justify-between border-b border-border-subtle bg-surface-container-high/30">
            <span className="text-label-caps font-label-caps text-primary uppercase tracking-wider font-bold">Security Credentials</span>
            <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
          </div>

          <div className="p-6 flex-1 space-y-4 flex flex-col justify-center">
            {/* Current Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Current Password</label>
              <div className="relative">
                <input
                  id="settings-currentPassword"
                  type={showPwd.curr ? 'text' : 'password'}
                  className={`w-full bg-surface-deep border border-border-subtle rounded px-4 py-2 pr-10 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all font-body-md text-sm ${
                    pwdErrors.currentPassword ? 'border-error' : ''
                  }`}
                  value={pwdForm.currentPassword}
                  onChange={e => setPwd('currentPassword', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => toggle('curr')}
                  className="absolute inset-y-0 right-3 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px]">{showPwd.curr ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {pwdErrors.currentPassword && <span className="text-[11px] text-error font-semibold mt-0.5">{pwdErrors.currentPassword}</span>}
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">New Password</label>
              <div className="relative">
                <input
                  id="settings-newPassword"
                  type={showPwd.new ? 'text' : 'password'}
                  className={`w-full bg-surface-deep border border-border-subtle rounded px-4 py-2 pr-10 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all font-body-md text-sm ${
                    pwdErrors.newPassword ? 'border-error' : ''
                  }`}
                  value={pwdForm.newPassword}
                  onChange={e => setPwd('newPassword', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => toggle('new')}
                  className="absolute inset-y-0 right-3 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px]">{showPwd.new ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {pwdErrors.newPassword && <span className="text-[11px] text-error font-semibold mt-0.5">{pwdErrors.newPassword}</span>}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Confirm Password</label>
              <div className="relative">
                <input
                  id="settings-confirmPassword"
                  type={showPwd.confirm ? 'text' : 'password'}
                  className={`w-full bg-surface-deep border border-border-subtle rounded px-4 py-2 pr-10 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all font-body-md text-sm ${
                    pwdErrors.confirmPassword ? 'border-error' : ''
                  }`}
                  value={pwdForm.confirmPassword}
                  onChange={e => setPwd('confirmPassword', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => toggle('confirm')}
                  className="absolute inset-y-0 right-3 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px]">{showPwd.confirm ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {pwdErrors.confirmPassword && <span className="text-[11px] text-error font-semibold mt-0.5">{pwdErrors.confirmPassword}</span>}
            </div>

            <button
              id="btn-change-password"
              className="w-full py-2.5 bg-surface-container-highest text-primary border border-primary/20 font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-primary/10 transition-all outline-none mt-2 active:scale-95"
              onClick={handleChangePassword}
              disabled={savingPwd}
            >
              {savingPwd ? 'Updating Password…' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* System Preferences (Col 12) */}
        <div className="lg:col-span-12 bg-surface-bright border border-border-subtle rounded-xl flex flex-col shadow-sm">
          <div className="h-12 px-6 flex items-center justify-between border-b border-border-subtle bg-surface-container-high/30">
            <span className="text-label-caps font-label-caps text-primary uppercase tracking-wider font-bold">System Preferences</span>
            <span className="material-symbols-outlined text-outline text-[20px]">settings_suggest</span>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {/* Appearance */}
            <div className="space-y-4">
              <h4 className="text-body-md font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">dark_mode</span> Interface Styling
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`flex flex-col gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                    theme === 'dark' ? 'border-primary bg-surface-container-highest' : 'border-border-subtle bg-transparent hover:bg-surface-container/30'
                  }`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <div className="w-full aspect-video bg-[#020617] rounded-md border border-border-subtle p-1">
                    <div className="w-full h-full bg-[#122131] rounded-sm"></div>
                  </div>
                  <span className={`text-[10px] font-bold text-center ${theme === 'dark' ? 'text-primary' : 'text-outline'}`}>Sentinel Dark</span>
                </div>
                
                <div
                  className={`flex flex-col gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                    theme === 'light' ? 'border-primary bg-surface-container-highest' : 'border-border-subtle bg-transparent hover:bg-surface-container/30'
                  }`}
                  onClick={() => handleThemeChange('light')}
                >
                  <div className="w-full aspect-video bg-white rounded-md border border-gray-200 p-1">
                    <div className="w-full h-full bg-gray-100 rounded-sm"></div>
                  </div>
                  <span className={`text-[10px] font-bold text-center ${theme === 'light' ? 'text-primary' : 'text-outline'}`}>Arctic Light</span>
                </div>
              </div>
            </div>

            {/* regional settings - read-only mockup */}
            <div className="space-y-4 opacity-65 pointer-events-none select-none">
              <h4 className="text-body-md font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">language</span> Regional Settings
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-outline">Interface Language</label>
                  <select className="w-full bg-surface-deep border border-border-subtle rounded px-3 py-1.5 text-xs focus:ring-0 outline-none" defaultValue="en">
                    <option value="en">English (United States)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-outline">System Time Zone</label>
                  <select className="w-full bg-surface-deep border border-border-subtle rounded px-3 py-1.5 text-xs focus:ring-0 outline-none" defaultValue="utc">
                    <option value="utc">Coordinated Universal Time (UTC)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* regional settings */}
            <div className="space-y-4">
              <h4 className="text-body-md font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">database</span> Data Integrity
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded bg-surface-deep border border-border-subtle opacity-65 pointer-events-none select-none">
                  <div>
                    <p className="font-bold text-on-surface">Export Security Log</p>
                    <p className="text-[10px] text-outline mt-0.5">Generates encrypted CSV details</p>
                  </div>
                  <span className="material-symbols-outlined text-outline">download</span>
                </div>
                <div 
                  className="flex items-center justify-between p-3 rounded bg-surface-deep border border-border-subtle cursor-pointer hover:border-primary group transition-all"
                  onClick={() => setShowSeedConfirm(true)}
                >
                  <div>
                    <p className="font-bold text-on-surface group-hover:text-primary transition-colors">Seed Sample Data</p>
                    <p className="text-[10px] text-outline mt-0.5">Populates the database with sample managers, agents, and policies</p>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">database</span>
                </div>
                <div 
                  className="flex items-center justify-between p-3 rounded bg-surface-deep border border-border-subtle cursor-pointer hover:border-error group transition-all"
                  onClick={() => setShowResetConfirm(true)}
                >
                  <div>
                    <p className="font-bold text-on-surface group-hover:text-error transition-colors">Reset System Database</p>
                    <p className="text-[10px] text-outline mt-0.5">Wipes all policy, proposer, and team records</p>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-error transition-colors">delete_forever</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmDialog
        open={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleConfirmReset}
        title="Reset System Database"
        message="Are you sure you want to reset the database? This will permanently delete all policies, proposals, and team records. Logged-in users will not be affected."
      />

      <ConfirmDialog
        open={showSeedConfirm}
        onClose={() => setShowSeedConfirm(false)}
        onConfirm={handleConfirmSeed}
        title="Seed Sample Data"
        message="Are you sure you want to seed the database with sample data? This will clear all existing policies, proposals, and team records before adding standard test records."
      />
    </div>
  );
}

