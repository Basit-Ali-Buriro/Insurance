import React, { lazy, Suspense, useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import api from '../lib/api.js';
import { useToast } from './Toast.jsx';

const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const ProposerRegister = lazy(() => import('../pages/ProposerRegister.jsx'));
const PolicyRegister = lazy(() => import('../pages/PolicyRegister.jsx'));
const SRRegister = lazy(() => import('../pages/SRRegister.jsx'));
const SMRecruitment = lazy(() => import('../pages/SMRecruitment.jsx'));
const SSMRecruitment = lazy(() => import('../pages/SSMRecruitment.jsx'));
const AreaManager = lazy(() => import('../pages/AreaManager.jsx'));
const ShowTeam = lazy(() => import('../pages/ShowTeam.jsx'));
const BusinessFigure = lazy(() => import('../pages/BusinessFigure.jsx'));
const Notifications = lazy(() => import('../pages/Notifications.jsx'));
const Settings = lazy(() => import('../pages/Settings.jsx'));
const UsersPage = lazy(() => import('../pages/UsersPage.jsx'));

const PAGE_MAP = {
  dashboard: { component: Dashboard, label: 'Dashboard', sub: 'Overview of your insurance business performance' },
  proposer: { component: ProposerRegister, label: 'Proposer Register', sub: 'Register and manage customer proposals' },
  policy: { component: PolicyRegister, label: 'Policy Register', sub: 'Create and manage insurance policies' },
  sr: { component: SRRegister, label: 'SR Recruitment', sub: 'Manage Sales Representatives' },
  sm: { component: SMRecruitment, label: 'SM Recruitment', sub: 'Manage Sales Managers and hierarchies' },
  ssm: { component: SSMRecruitment, label: 'SSM Recruitment', sub: 'Manage Senior Sales Managers' },
  areamanager: { component: AreaManager, label: 'Area Manager', sub: 'Manage regional Area Managers' },
  showteam: { component: ShowTeam, label: 'Show Team', sub: 'Unified dashboard of your entire sales force' },
  businessfigure: { component: BusinessFigure, label: 'Business Figure', sub: 'Analyze sales figures and targets' },
  notifications: { component: Notifications, label: 'Notifications', sub: 'Actionable policy alerts and reminders' },
  settings: { component: Settings, label: 'Settings', sub: 'Configure terminal preferences and credentials' },
  users: { component: UsersPage, label: 'Users', sub: 'Super-admin user account administration' },
};

const Spinner = () => (
  <div className="flex items-center justify-center h-64 text-outline">
    <span className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full" />
  </div>
);

export default function AppShell({ user, licenseInfo, activePage, onNavigate, onLogout, onProfileUpdate }) {
  const toast = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    api.notificationCount().then(c => setNotifCount(c || 0)).catch(() => { });
  }, [activePage]);

  // Trigger system notification toast if license is expiring
  useEffect(() => {
    if (licenseInfo?.status === 'expiring' && user?.role !== 'developer') {
      toast('Your software license is expiring soon in upcoming following days. Contact the developer for activation key.', 'warning');
    }
  }, [licenseInfo, toast, user]);

  // Global F1-F12 tab navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const match = e.key.match(/^F(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= 12) {
          const visiblePages = [
            { key: 'dashboard', devOnly: false },
            { key: 'proposer', devOnly: false },
            { key: 'policy', devOnly: false },
            { key: 'sr', devOnly: false },
            { key: 'sm', devOnly: false },
            { key: 'ssm', devOnly: false },
            { key: 'areamanager', devOnly: false },
            { key: 'showteam', devOnly: false },
            { key: 'businessfigure', devOnly: false },
            { key: 'notifications', devOnly: false },
            { key: 'settings', devOnly: false },
            { key: 'users', devOnly: true },
          ].filter(p => !p.devOnly || user?.role === 'developer');

          const idx = num - 1;
          if (idx >= 0 && idx < visiblePages.length) {
            e.preventDefault();
            onNavigate(visiblePages[idx].key);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, onNavigate]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const [policies, proposers, srs, sms, ssms, ams] = await Promise.all([
        api.listPolicies().catch(() => []),
        api.listProposers().catch(() => []),
        api.listSR().catch(() => []),
        api.listSM().catch(() => []),
        api.listSSM().catch(() => []),
        api.listAM().catch(() => [])
      ]);

      const results = [];
      const q = query.toLowerCase();

      // Search Policies
      policies.forEach(p => {
        if (p.policy_no.toLowerCase().includes(q) || p.holder_name.toLowerCase().includes(q)) {
          results.push({ type: 'policy', page: 'policy', id: p.id, label: `Policy: ${p.policy_no}`, sub: p.holder_name, value: p.policy_no });
        }
      });

      // Search Proposers
      proposers.forEach(p => {
        if (p.proposal_no.toLowerCase().includes(q) || p.holder_name.toLowerCase().includes(q)) {
          results.push({ type: 'proposer', page: 'proposer', id: p.id, label: `Proposal: ${p.proposal_no}`, sub: p.holder_name, value: p.proposal_no });
        }
      });

      // Search Team (AMs, SSMs, SMs, SRs)
      srs.forEach(s => {
        if (s.sr_code.toLowerCase().includes(q) || (s.sr_name && s.sr_name.toLowerCase().includes(q))) {
          results.push({ type: 'sr', page: 'sr', id: s.id, label: `SR: ${s.sr_name}`, sub: s.sr_code, value: s.sr_code });
        }
      });
      sms.forEach(s => {
        if (s.sm_code.toLowerCase().includes(q) || (s.sm_name && s.sm_name.toLowerCase().includes(q))) {
          results.push({ type: 'sm', page: 'sm', id: s.id, label: `SM: ${s.sm_name}`, sub: s.sm_code, value: s.sm_code });
        }
      });
      ssms.forEach(s => {
        if (s.ssm_code.toLowerCase().includes(q) || (s.ssm_name && s.ssm_name.toLowerCase().includes(q))) {
          results.push({ type: 'ssm', page: 'ssm', id: s.id, label: `SSM: ${s.ssm_name}`, sub: s.ssm_code, value: s.ssm_code });
        }
      });
      ams.forEach(a => {
        if (a.am_code.toLowerCase().includes(q) || (a.am_name && a.am_name.toLowerCase().includes(q))) {
          results.push({ type: 'am', page: 'areamanager', id: a.id, label: `AM: ${a.am_name}`, sub: a.am_code, value: a.am_code });
        }
      });

      setSearchResults(results.slice(0, 8));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectResult = (result) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchFilter(result.value);
    window.history.pushState(null, '', `?highlight=${result.id}`);
    onNavigate(result.page);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setSearchResults([]);
    }, 200);
  };

  const PageEntry = PAGE_MAP[activePage] ?? PAGE_MAP.dashboard;
  const PageComp = PageEntry.component;
  const SafeComp = activePage === 'users' && user?.role !== 'developer' ? Dashboard : PageComp;

  const showBanner = (licenseInfo?.status === 'expiring' || licenseInfo?.status === 'expired') && user?.role !== 'developer';
  const isUrgent = licenseInfo?.daysLeft <= 7;

  // Generate initials for avatar fallback
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'US';

  return (
    <div className="h-screen w-screen bg-surface-deep text-on-surface flex overflow-hidden">
      {/* Fixed/Responsive Sidebar */}
      <Sidebar
        user={user}
        activePage={activePage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Layout Area */}
      <div className={`flex flex-col h-full flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'ml-0 md:ml-[80px]' : 'ml-0 md:ml-[260px]'
        }`}>
        {/* Top Navbar */}
        <header className="h-14 flex justify-between items-center px-4 md:px-8 bg-surface-deep border-b border-outline-variant sticky top-0 z-40 select-none shrink-0 w-full">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-on-surface-variant hover:text-electric-blue transition-colors p-1 flex items-center justify-center"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex text-on-surface-variant hover:text-electric-blue transition-colors p-1 items-center justify-center"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isSidebarCollapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
            <div className="flex-col text-left hidden sm:flex select-none">
              <span className="text-sm font-bold text-on-surface leading-none tracking-wider font-['Outfit']">Lalwani</span>
              <span className="text-[9px] text-on-surface-variant opacity-75 font-bold tracking-[0.12em] leading-none mt-0.5">Software Solutions</span>
            </div>
            <div className="h-6 w-[1px] bg-outline-variant mx-2 hidden sm:block"></div>

            {/* Global Search */}
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                className="w-full bg-surface-container-low border border-outline-variant rounded-full py-1 pl-9 pr-4 text-body-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-electric-blue transition-all"
                placeholder="Global Search..."
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onBlur={handleBlur}
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 mt-2 w-80 bg-surface-container border border-outline-variant rounded-xl shadow-2xl overflow-hidden z-50 glass-panel">
                  <div className="py-1 max-h-96 overflow-y-auto custom-scrollbar">
                    {searchResults.map((res, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2.5 hover:bg-surface-variant/40 cursor-pointer flex flex-col justify-center border-b border-outline-variant/30 last:border-0"
                        onMouseDown={() => handleSelectResult(res)}
                      >
                        <span className="text-body-md font-bold text-electric-blue">{res.label}</span>
                        <span className="text-[10px] text-outline mt-0.5">{res.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 sm:gap-4 text-on-surface-variant">
              <button
                onClick={() => onNavigate('notifications')}
                className="hover:text-electric-blue transition-colors p-1 relative"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {notifCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-crimson-red rounded-full"></span>
                )}
              </button>
              <button
                onClick={toggleTheme}
                className="hover:text-electric-blue transition-colors p-1"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="hover:text-electric-blue transition-colors p-1"
                title="Settings"
              >
                <span className="material-symbols-outlined text-[22px]">settings</span>
              </button>
            </div>

            <div className="h-6 w-[1px] bg-outline-variant" />

            {/* Profile Info */}
            <div className="flex items-center gap-2.5 bg-surface-container py-1 px-2.5 rounded-lg border border-outline-variant select-none">
              <div
                className="h-7 w-7 rounded-lg bg-surface-deep border border-outline-variant/50 flex items-center justify-center text-electric-blue font-bold text-xs cursor-pointer hover:border-electric-blue transition-colors"
                onClick={() => onNavigate('settings')}
                title="Click for settings"
              >
                {initials}
              </div>
              <div className="text-left hidden lg:block pr-1 select-none">
                <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">{user?.role === 'developer' ? 'Super Admin' : 'Agent Admin'}</p>
                <p className="text-xs font-bold text-on-surface leading-tight mt-0.5">{user?.name || 'Administrator'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* License warning banner */}
        {showBanner && (
          <div className={`${isUrgent
              ? 'bg-crimson-red text-white'
              : 'bg-vivid-orange text-deep-charcoal'
            } px-6 py-2.5 flex items-center justify-center gap-3 text-body-md select-none shrink-0 border-b border-black/10`}>
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isUrgent ? 'error' : 'warning'}
            </span>
            <p className="font-semibold text-xs sm:text-sm">
              {licenseInfo.daysLeft <= 15
                ? `${licenseInfo.daysLeft} days are remaining in the License Expiration`
                : `Your software license is expiring soon in upcoming following days (${licenseInfo.daysLeft} day(s) left). Contact the developer for activation key.`}
            </p>
            <button
              className="underline font-bold hover:opacity-80 transition-opacity ml-4 text-xs tracking-wider"
              onClick={() => onNavigate('settings')}
            >
              Update Now
            </button>
          </div>
        )}

        {/* Page Content wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Page Title Header */}
          <div className="border-b border-outline-variant pb-4 mb-2 select-none">
            <div className="text-[9px] text-outline uppercase tracking-widest font-bold flex items-center gap-1.5 mb-1.5">
              <span>System</span>
              <span>›</span>
              <span className="text-electric-blue font-extrabold">{PageEntry.label}</span>
            </div>
            <h1 className="text-headline-md sm:text-headline-lg font-bold text-on-surface">{PageEntry.label}</h1>
            <p className="text-body-md text-on-surface-variant mt-0.5">{PageEntry.sub}</p>
          </div>

          <div className="pb-12">
            <Suspense fallback={<Spinner />}>
              <SafeComp
                user={user}
                onNavigate={onNavigate}
                onProfileUpdate={onProfileUpdate}
                searchFilter={searchFilter}
                clearSearchFilter={() => setSearchFilter('')}
              />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Atmospheric BG effect */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-electric-blue/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-royal-purple/5 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
}
