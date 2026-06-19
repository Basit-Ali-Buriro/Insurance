import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';
import logo from '../../assets/logo.svg';

const PAGES = [
  { key: 'dashboard',        label: 'Dashboard',         icon: 'dashboard' },
  { key: 'proposer',         label: 'Proposer Register',  icon: 'assignment' },
  { key: 'policy',           label: 'Policy Register',    icon: 'menu_book' },
  { key: 'sr',               label: 'SR Recruitment',        icon: 'person' },
  { key: 'sm',               label: 'SM Recruitment',     icon: 'groups' },
  { key: 'ssm',              label: 'SSM Recruitment',    icon: 'stars' },
  { key: 'areamanager',      label: 'Area Manager',       icon: 'map' },
  { key: 'showteam',         label: 'Show Team',          icon: 'hub' },
  { key: 'businessfigure',   label: 'Business Figure',    icon: 'analytics' },
  { key: 'notifications',    label: 'Notifications',      icon: 'notifications' },
  { key: 'settings',         label: 'Settings',           icon: 'settings' },
  { key: 'users',            label: 'Users',              icon: 'admin_panel_settings', devOnly: true },
];

export default function Sidebar({ user, activePage, onNavigate, onLogout, isOpen, onClose, isCollapsed }) {
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const c = await api.notificationCount();
        if (mounted) setNotifCount(c || 0);
      } catch { /* silent */ }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (activePage === 'notifications') {
      api.notificationCount().then(c => setNotifCount(c || 0)).catch(() => {});
    }
  }, [activePage]);

  const visiblePages = PAGES.filter(p => !p.devOnly || user?.role === 'developer');

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`fixed left-0 top-0 h-full bg-surface-container border-r border-border-subtle flex flex-col py-6 z-50 overflow-y-auto select-none transition-all duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isCollapsed ? 'w-[80px]' : 'w-[260px]'
      }`}>
        {/* Brand Logo */}
        <div className={`mb-6 flex items-center justify-center ${isCollapsed ? 'px-2' : 'px-6 gap-4'}`}>
          <img src={logo} alt="Nexus Insure Logo" className={`${isCollapsed ? 'w-10 h-10' : 'w-14 h-14'} object-contain rounded-lg shrink-0`} />
          {!isCollapsed && (
            <div className="truncate flex-1">
              <h1 className="text-base font-bold text-on-surface leading-tight tracking-wider font-['Outfit']">Lalwani</h1>
              <p className="text-[9px] uppercase tracking-[0.15em] text-on-surface-variant opacity-75 font-semibold">Software Solutions</p>
            </div>
          )}
        </div>

        {/* User Session Block */}
        {user && !isCollapsed && (
          <div className="mx-4 p-3 mb-6 bg-surface-deep border border-outline-variant/30 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-electric-blue flex items-center justify-center font-bold text-white uppercase text-sm shrink-0">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="truncate text-left select-none">
              <span className="font-label-lg text-[10px] text-on-surface-variant uppercase tracking-wider font-bold block">{user.role === 'developer' ? 'Super Admin' : 'Agent Admin'}</span>
              <span className="font-body-sm text-sm text-on-surface font-semibold truncate block mt-0.5">{user.name}</span>
            </div>
          </div>
        )}
        {user && isCollapsed && (
          <div className="px-2 py-3 mb-6 flex justify-center border-y border-border-subtle bg-surface-deep/30">
            <div 
              className="h-8 w-8 rounded-full bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center text-electric-blue font-bold text-xs select-none"
              title={`Active Session: ${user.name} (${user.role})`}
            >
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-grow space-y-0.5 px-3">
          {visiblePages.map(p => {
            const isActive = activePage === p.key;
            return (
              <button
                key={p.key}
                id={`nav-${p.key}`}
                className={`w-full flex items-center rounded-lg text-body-md transition-all duration-150 group outline-none relative ${
                  isCollapsed ? 'justify-center py-3 px-2' : 'gap-3 px-4 py-2.5'
                } ${
                  isActive
                    ? 'text-on-surface font-bold border-l-4 border-electric-blue bg-surface-deep translate-x-0.5'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
                onClick={() => {
                  onNavigate(p.key);
                  if (onClose) onClose();
                }}
                title={p.label}
              >
                <span className={`material-symbols-outlined text-[20px] transition-colors ${
                  isActive ? 'text-electric-blue' : 'text-outline group-hover:text-on-surface'
                }`}>
                  {p.icon}
                </span>
                {!isCollapsed && <span className="font-label-lg text-label-lg text-left flex-1 truncate">{p.label}</span>}
                {!isCollapsed && p.key === 'notifications' && notifCount > 0 && (
                  <span className="bg-error text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
                {isCollapsed && p.key === 'notifications' && notifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-error text-white text-[8px] font-bold rounded-full w-[14px] h-[14px] flex items-center justify-center">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 mt-auto pt-4 border-t border-border-subtle">
          <button
            className={`w-full flex items-center justify-center rounded-lg text-body-md font-bold text-crimson-red bg-crimson-red/5 hover:bg-crimson-red/15 active:scale-[0.98] transition-all duration-150 ${
              isCollapsed ? 'py-3' : 'gap-2 px-4 py-3'
            }`}
            id="btn-logout"
            onClick={onLogout}
            title="Log Out"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>

        {/* Copyright */}
        {!isCollapsed && (
          <div className="px-4 py-3 text-center text-[8px] text-on-surface-variant/40 uppercase tracking-wider font-bold select-none leading-normal shrink-0">
            © 2026 Lalwani Software Solutions.
          </div>
        )}
      </aside>
    </>
  );
}
