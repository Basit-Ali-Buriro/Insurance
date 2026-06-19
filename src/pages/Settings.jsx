import React, { useState } from 'react';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

export default function Settings({ user, onProfileUpdate }) {
  const toast = useToast();
  const [profile,   setProfile]   = useState({ name: user?.name || '', username: user?.username || '' });
  const [pwdForm,   setPwdForm]   = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [savingP,   setSavingP]   = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdErrors, setPwdErrors] = useState({});
  const [showPwd,   setShowPwd]   = useState({ curr:false, new:false, confirm:false });
  const [packaging, setPackaging] = useState(false);

  const handlePackageApp = async () => {
    if (!confirm("Are you sure you want to build and package the app setup? This will copy the current database as the template, compile React, build the Electron package, and create a ZIP archive of the installer. This may take up to a minute.")) {
      return;
    }
    setPackaging(true);
    toast('Starting software packaging & zip creation. Please wait...', 'info');
    try {
      const res = await api.packageApp();
      if (res?.ok) {
        toast('Software packaged and zipped successfully! Created: Insurance_Setup_Exe.zip in project root.', 'success');
      } else {
        toast(res?.error || 'Packaging failed.', 'error');
      }
    } catch (err) {
      toast(err.message || 'Error occurred during packaging.', 'error');
    } finally {
      setPackaging(false);
    }
  };

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
              className="px-5 py-2 bg-primary text-on-primary font-bold rounded-lg font-body-md text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleSaveProfile}
              disabled={savingP || (profile.name.trim() === (user?.name || '') && profile.username.trim() === (user?.username || ''))}
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
      </div>

      {/* Row 2: System Operations & Developer support */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* System Operations & Data Integrity (Col 7) */}
        <div className="lg:col-span-7 bg-surface-bright border border-border-subtle rounded-xl flex flex-col shadow-sm">
          <div className="h-12 px-6 flex items-center justify-between border-b border-border-subtle bg-surface-container-high/30">
            <span className="text-label-caps font-label-caps text-primary uppercase tracking-wider font-bold">System Operations & Data Integrity</span>
            <span className="material-symbols-outlined text-outline text-[20px]">database</span>
          </div>
          <div className="p-6 space-y-6 flex-1">
            {/* Backup & Restore Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-on-surface">Data Backup & Recovery</h4>
              <p className="text-xs text-on-surface-variant">Manage database backups. You can download the current system state or restore from a previously saved archive.</p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  id="btn-settings-backup"
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-primary border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-primary/10 transition-all active:scale-95 outline-none"
                  onClick={async () => {
                    toast('Downloading database backup...', 'info');
                    const res = await api.downloadBackup();
                    if (res?.ok) toast('Database backup saved successfully', 'success');
                    else if (res?.ok === false) toast('Backup cancelled', 'info');
                    else toast('Database backup failed', 'error');
                  }}
                >
                  <span className="material-symbols-outlined text-sm">cloud_download</span> Download Backup
                </button>
                <button
                  id="btn-settings-restore"
                  className="flex items-center gap-2 px-4 py-2 bg-electric-blue text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all active:scale-95 shadow-md shadow-electric-blue/20 outline-none"
                  onClick={async () => {
                    if (confirm("WARNING: Restoring a backup will overwrite all current policies, proposals, and team records. Are you sure you want to proceed?")) {
                      toast('Restoring database from backup...', 'info');
                      const res = await api.restoreBackup();
                      if (res?.ok) {
                        toast('Database restored successfully! Reloading system...', 'success');
                        setTimeout(() => { api.reloadApp(); }, 1500);
                      } else if (res?.canceled) {
                        toast('Restore operation cancelled', 'info');
                      } else {
                        toast(res?.error || 'Restore failed', 'error');
                      }
                    }
                  }}
                >
                  <span className="material-symbols-outlined text-sm">settings_backup_restore</span> Restore Backup
                </button>
              </div>
            </div>

            {/* Developer Reset Section */}
            {user?.role === 'developer' && (
              <div className="space-y-3 pt-6 border-t border-border-subtle/50">
                <h4 className="text-sm font-bold text-error flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">warning</span> Developer System Operations
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Wipe all sample data (policies, proposals, team structures, notifications, targets) before shipping. User accounts will NOT be deleted. You can also package and zip the standalone application setup installer.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    id="btn-settings-reset-db"
                    className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all active:scale-95 shadow-md shadow-error/20 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={async () => {
                      if (confirm("WARNING: This will permanently delete all policies, proposals, area managers, SSMs, SMs, SRs, notifications, and targets, leaving only the registered user accounts. Are you sure you want to proceed?")) {
                        toast('Resetting system database...', 'info');
                        const res = await api.resetDatabase();
                        if (res?.ok) {
                          toast('Database reset successfully! Reloading system...', 'success');
                          setTimeout(() => { api.reloadApp(); }, 1500);
                        } else {
                          toast(res?.error || 'Database reset failed', 'error');
                        }
                      }
                    }}
                    disabled={packaging}
                  >
                    <span className="material-symbols-outlined text-sm">delete_forever</span> Reset Database
                  </button>
                  <button
                    id="btn-settings-seed-db"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all active:scale-95 shadow-md shadow-purple-600/20 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={async () => {
                      if (confirm("Seeding database with sample records will overwrite/add mock records. Proceed?")) {
                        toast('Seeding database with sample records...', 'info');
                        const res = await api.seedDatabase();
                        if (res?.ok) {
                          toast('Database seeded successfully! Reloading system...', 'success');
                          setTimeout(() => { api.reloadApp(); }, 1500);
                        } else {
                          toast(res?.error || 'Database seeding failed', 'error');
                        }
                      }
                    }}
                    disabled={packaging}
                  >
                    <span className="material-symbols-outlined text-sm">science</span> Seed Sample Data
                  </button>
                  <button
                    id="btn-settings-package-app"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all active:scale-95 shadow-md shadow-primary/20 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={handlePackageApp}
                    disabled={packaging}
                  >
                    <span className={`material-symbols-outlined text-sm ${packaging ? 'animate-spin' : ''}`}>{packaging ? 'sync' : 'package_2'}</span>
                    {packaging ? 'Packaging App...' : 'Build & Package App'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Developer Contact Info (Col 5) */}
        <div className="lg:col-span-5 bg-surface-bright border border-border-subtle rounded-xl flex flex-col shadow-sm">
          <div className="h-12 px-6 flex items-center justify-between border-b border-border-subtle bg-surface-container-high/30">
            <span className="text-label-caps font-label-caps text-primary uppercase tracking-wider font-bold">Developer Support</span>
            <span className="material-symbols-outlined text-outline text-[20px]">support_agent</span>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-center">
            {/* Dev 1 */}
            <div className="p-4 bg-surface-deep border border-outline-variant/30 rounded-lg relative overflow-hidden group">
              <span className="material-symbols-outlined text-[64px] absolute right-2 bottom-[-10px] opacity-5 text-primary group-hover:scale-110 transition-transform duration-300">code</span>
              <h5 className="font-bold text-on-surface text-sm">Subhash Prem</h5>
              <p className="text-[10px] uppercase text-primary font-bold tracking-widest mt-0.5">Software Architect</p>
              <div className="mt-3 space-y-1.5 text-xs text-on-surface-variant font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-outline">call</span>
                  <a href="tel:03337104578" className="hover:text-electric-blue transition-colors">0333-7104578</a>
                  <span className="text-outline-variant">/</span>
                  <a href="tel:03152967527" className="hover:text-electric-blue transition-colors">0315-2967527</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
                  <a href="mailto:subhashprem4@gmail.com" className="hover:text-electric-blue transition-colors">subhashprem4@gmail.com</a>
                </div>
              </div>
            </div>

            {/* Dev 2 */}
            <div className="p-4 bg-surface-deep border border-outline-variant/30 rounded-lg relative overflow-hidden group">
              <span className="material-symbols-outlined text-[64px] absolute right-2 bottom-[-10px] opacity-5 text-primary group-hover:scale-110 transition-transform duration-300">terminal</span>
              <h5 className="font-bold text-on-surface text-sm">Basit Ali</h5>
              <p className="text-[10px] uppercase text-primary font-bold tracking-widest mt-0.5">Full Stack Developer</p>
              <div className="mt-3 space-y-1.5 text-xs text-on-surface-variant font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-outline">call</span>
                  <a href="tel:03243859337" className="hover:text-electric-blue transition-colors">0324-3859337</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
                  <a href="mailto:basit.web24@gmail.com" className="hover:text-electric-blue transition-colors">basit.web24@gmail.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="w-full text-center py-4 border-t border-border-subtle/50 text-[10px] text-outline uppercase tracking-widest font-semibold">
        © 2026 Lalwani Software Solutions.
      </div>
    </div>
  );
}
