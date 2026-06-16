import React, { lazy, Suspense, useState } from 'react';
import Sidebar from './Sidebar.jsx';
import api from '../lib/api.js';

const Dashboard       = lazy(() => import('../pages/Dashboard.jsx'));
const ProposerRegister= lazy(() => import('../pages/ProposerRegister.jsx'));
const PolicyRegister  = lazy(() => import('../pages/PolicyRegister.jsx'));
const SRRegister      = lazy(() => import('../pages/SRRegister.jsx'));
const SMRecruitment   = lazy(() => import('../pages/SMRecruitment.jsx'));
const SSMRecruitment  = lazy(() => import('../pages/SSMRecruitment.jsx'));
const AreaManager     = lazy(() => import('../pages/AreaManager.jsx'));
const ShowTeam        = lazy(() => import('../pages/ShowTeam.jsx'));
const BusinessFigure  = lazy(() => import('../pages/BusinessFigure.jsx'));
const Notifications   = lazy(() => import('../pages/Notifications.jsx'));
const Settings        = lazy(() => import('../pages/Settings.jsx'));
const UsersPage       = lazy(() => import('../pages/UsersPage.jsx'));

const PAGE_MAP = {
  dashboard:      { component: Dashboard,         label: 'Dashboard',         sub: 'Overview of your insurance business performance' },
  proposer:       { component: ProposerRegister,  label: 'Proposer Register',  sub: 'Register and manage customer proposals' },
  policy:         { component: PolicyRegister,    label: 'Policy Register',    sub: 'Create and manage insurance policies' },
  sr:             { component: SRRegister,        label: 'SR Register',        sub: 'Manage Sales Representatives' },
  sm:             { component: SMRecruitment,     label: 'SM Recruitment',     sub: 'Manage Sales Managers and hierarchies' },
  ssm:            { component: SSMRecruitment,    label: 'SSM Recruitment',    sub: 'Manage Senior Sales Managers' },
  areamanager:    { component: AreaManager,       label: 'Area Manager',       sub: 'Manage regional Area Managers' },
  showteam:       { component: ShowTeam,          label: 'Show Team',          sub: 'Unified dashboard of your entire sales force' },
  businessfigure: { component: BusinessFigure,    label: 'Business Figure',    sub: 'Analyze sales figures and targets' },
  notifications:  { component: Notifications,     label: 'Notifications',      sub: 'Actionable policy alerts and reminders' },
  settings:       { component: Settings,          label: 'Settings',           sub: 'Configure terminal preferences and credentials' },
  users:          { component: UsersPage,         label: 'Users',              sub: 'Super-admin user account administration' },
};

const Spinner = () => (
  <div className="flex items-center justify-center h-64 text-outline">
    <span className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full" />
  </div>
);

export default function AppShell({ user, licenseInfo, activePage, onNavigate, onLogout, onProfileUpdate }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

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
          results.push({ type: 'policy', page: 'policy', label: `Policy: ${p.policy_no}`, sub: p.holder_name, value: p.policy_no });
        }
      });

      // Search Proposers
      proposers.forEach(p => {
        if (p.proposal_no.toLowerCase().includes(q) || p.holder_name.toLowerCase().includes(q)) {
          results.push({ type: 'proposer', page: 'proposer', label: `Proposal: ${p.proposal_no}`, sub: p.holder_name, value: p.proposal_no });
        }
      });

      // Search Team (AMs, SSMs, SMs, SRs)
      srs.forEach(s => {
        if (s.sr_code.toLowerCase().includes(q) || (s.sr_name && s.sr_name.toLowerCase().includes(q))) {
          results.push({ type: 'sr', page: 'sr', label: `SR: ${s.sr_name}`, sub: s.sr_code, value: s.sr_code });
        }
      });
      sms.forEach(s => {
        if (s.sm_code.toLowerCase().includes(q) || (s.sm_name && s.sm_name.toLowerCase().includes(q))) {
          results.push({ type: 'sm', page: 'sm', label: `SM: ${s.sm_name}`, sub: s.sm_code, value: s.sm_code });
        }
      });
      ssms.forEach(s => {
        if (s.ssm_code.toLowerCase().includes(q) || (s.ssm_name && s.ssm_name.toLowerCase().includes(q))) {
          results.push({ type: 'ssm', page: 'ssm', label: `SSM: ${s.ssm_name}`, sub: s.ssm_code, value: s.ssm_code });
        }
      });
      ams.forEach(a => {
        if (a.am_code.toLowerCase().includes(q) || (a.am_name && a.am_name.toLowerCase().includes(q))) {
          results.push({ type: 'am', page: 'areamanager', label: `AM: ${a.am_name}`, sub: a.am_code, value: a.am_code });
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
    onNavigate(result.page);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setSearchResults([]);
    }, 200);
  };
  const PageEntry  = PAGE_MAP[activePage] ?? PAGE_MAP.dashboard;
  const PageComp   = PageEntry.component;
  const SafeComp   = activePage === 'users' && user?.role !== 'developer' ? Dashboard : PageComp;

  const showBanner = licenseInfo?.status === 'expiring' || licenseInfo?.status === 'expired';
  const isUrgent   = licenseInfo?.daysLeft <= 7;

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
      <div className={`flex flex-col h-full flex-1 min-w-0 overflow-hidden transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-0 md:ml-[80px]' : 'ml-0 md:ml-[260px]'
      }`}>
        {/* Top Navbar */}
        <header className="h-16 flex justify-between items-center px-4 md:px-8 bg-surface-container border-b border-border-subtle sticky top-0 z-40 select-none shrink-0 w-full">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-outline hover:text-primary transition-colors p-1.5 hover:bg-surface-variant/30 rounded-lg flex items-center justify-center"
              title="Open Menu"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex text-outline hover:text-primary transition-colors p-1.5 hover:bg-surface-variant/30 rounded-lg items-center justify-center"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isSidebarCollapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
            <h2 className="text-sm sm:text-base md:text-headline-md font-bold text-primary truncate">Insurance ERP</h2>
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                className="bg-surface-deep border border-border-subtle text-on-surface rounded-full pl-9 pr-4 py-1.5 w-64 focus:ring-1 focus:ring-primary focus:border-primary text-body-md placeholder:text-outline-variant outline-none transition-all"
                placeholder="Global search..."
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onBlur={handleBlur}
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 mt-2 w-80 bg-surface-container border border-border-subtle rounded-xl shadow-2xl overflow-hidden z-50 glassmorphism">
                  <div className="py-1 max-h-96 overflow-y-auto">
                    {searchResults.map((res, idx) => (
                      <div 
                        key={idx}
                        className="px-4 py-2 hover:bg-surface-variant/40 cursor-pointer flex flex-col justify-center border-b border-border-subtle last:border-0"
                        onClick={() => handleSelectResult(res)}
                      >
                        <span className="text-body-md font-bold text-primary">{res.label}</span>
                        <span className="text-[10px] text-outline mt-0.5">{res.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-1 sm:gap-3 text-outline">
              <button
                onClick={() => onNavigate('notifications')}
                className="hover:text-primary transition-colors p-1.5 hover:bg-surface-variant/30 rounded-full"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">notifications</span>
              </button>
              <button
                className="hover:text-primary transition-colors p-1.5 hover:bg-surface-variant/30 rounded-full cursor-default"
                title="Secure Terminal"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">security</span>
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className="hover:text-primary transition-colors p-1.5 hover:bg-surface-variant/30 rounded-full"
                title="Settings"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">settings</span>
              </button>
            </div>
            
            <div className="h-6 w-[1px] bg-border-subtle" />

            {/* Profile Info */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface leading-none">{user?.name || 'Administrator'}</p>
                <p className="text-[9px] text-outline uppercase tracking-wider mt-1">{user?.role === 'developer' ? 'Super Admin' : 'Agent Admin'}</p>
              </div>
              <div
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary-container/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs sm:text-sm cursor-pointer hover:border-primary transition-colors"
                onClick={() => onNavigate('settings')}
                title="Click for settings"
              >
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* License warning banner */}
        {showBanner && (
          <div className={`px-4 md:px-8 py-3 flex items-center gap-2.5 text-body-md select-none border-b shrink-0 ${
            isUrgent 
              ? 'bg-error-container/20 text-error border-error-container/30' 
              : 'bg-warning/10 text-warning border-warning/20'
          }`}>
            <span className="material-symbols-outlined text-[18px]">{isUrgent ? 'error' : 'warning'}</span>
            <span className="font-semibold text-xs sm:text-sm">
              {isUrgent
                ? `Your software license expires in ${licenseInfo.daysLeft} day(s). Immediate renewal required.`
                : `Your software license expires in ${licenseInfo.daysLeft} day(s). Please contact your software provider to renew.`}
            </span>
          </div>
        )}

        {/* Page Content wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Page Title Header */}
          <div className="border-b border-border-subtle pb-4 mb-2 select-none">
            <div className="text-[10px] text-outline uppercase tracking-widest font-semibold flex items-center gap-1.5 mb-1">
              <span>System</span>
              <span>›</span>
              <span className="text-primary">{PageEntry.label}</span>
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
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-success/3 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
}

