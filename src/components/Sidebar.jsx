import React, { useState, useEffect } from 'react';
import api from '../lib/api.js';

const PAGES = [
  { key: 'dashboard',        label: 'Dashboard',         icon: 'dashboard' },
  { key: 'proposer',         label: 'Proposer Register',  icon: 'assignment' },
  { key: 'policy',           label: 'Policy Register',    icon: 'menu_book' },
  { key: 'sr',               label: 'SR Register',        icon: 'person' },
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
      <aside className={`fixed left-0 top-0 h-full bg-surface-container border-r border-border-subtle flex flex-col py-stack-lg z-50 overflow-y-auto select-none transition-all duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isCollapsed ? 'w-[80px]' : 'w-[260px]'
      }`}>
        {/* Brand Logo */}
        <div className={`mb-8 flex items-center justify-center ${isCollapsed ? 'px-2' : 'px-6 gap-3'}`}>
          <div className="w-10 h-10 rounded-lg bg-primary-container/10 border border-primary/20 flex items-center justify-center text-primary text-[24px] shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="font-headline-md text-sm font-bold text-on-surface leading-tight">Sentinel Insure</h1>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-75">Records ERP</p>
            </div>
          )}
        </div>

        {/* Profile info */}
        {user && !isCollapsed && (
          <div className="px-6 py-3 mb-6 border-y border-border-subtle bg-surface-container-low/30">
            <div className="text-xs text-outline uppercase font-semibold tracking-wide">Terminal Session</div>
            <div className="text-sm font-bold text-on-surface mt-1 truncate">{user.name}</div>
            <span className={`inline-block px-2 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              user.role === 'developer' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {user.role}
            </span>
          </div>
        )}
        {user && isCollapsed && (
          <div className="px-2 py-3 mb-6 flex justify-center border-y border-border-subtle bg-surface-container-low/30">
            <div 
              className="h-8 w-8 rounded-full bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs select-none"
              title={`Active Session: ${user.name} (${user.role})`}
            >
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {visiblePages.map(p => {
            const isActive = activePage === p.key;
            return (
              <button
                key={p.key}
                id={`nav-${p.key}`}
                className={`w-full flex items-center rounded-lg text-body-md transition-all group outline-none relative ${
                  isCollapsed ? 'justify-center py-3 px-2' : 'gap-3 px-4 py-2.5'
                } ${
                  isActive
                    ? 'text-primary font-bold border-r-2 border-primary bg-surface-variant/30 shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                }`}
                onClick={() => {
                  onNavigate(p.key);
                  if (onClose) onClose();
                }}
                title={p.label}
              >
                <span className={`material-symbols-outlined text-[20px] transition-colors ${
                  isActive ? 'text-primary' : 'text-outline group-hover:text-on-surface'
                }`}>
                  {p.icon}
                </span>
                {!isCollapsed && <span className="font-body-md text-left flex-1 truncate">{p.label}</span>}
                {!isCollapsed && p.key === 'notifications' && notifCount > 0 && (
                  <span className="bg-error text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
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
        <div className="px-2 mt-auto pt-4 border-t border-border-subtle">
          <button
            className={`w-full flex items-center justify-center rounded-lg text-body-md font-bold text-error bg-error/5 hover:bg-error/15 active:scale-[0.98] transition-all ${
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
      </aside>
    </>
  );
}

