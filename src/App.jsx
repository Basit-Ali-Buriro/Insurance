import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/Toast.jsx';
import AppShell from './components/AppShell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LicenseRenewalPage from './pages/LicenseRenewalPage.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // On mount — get license state from main process
  useEffect(() => {
    window.electronAPI.getLicenseInfo().then(info => {
      setLicenseInfo(info);
      setLoading(false);
    }).catch(() => {
      setLicenseInfo({ status: 'valid', daysLeft: 365 });
      setLoading(false);
    });

    // Theme sync
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setActivePage('dashboard');
    if (licenseInfo && userData?.role !== 'developer') {
      if (licenseInfo.daysLeft <= 15 && licenseInfo.daysLeft > 0) {
        alert(`${licenseInfo.daysLeft} days are remaining in the License Expiration`);
      } else if (licenseInfo.daysLeft <= 30 && licenseInfo.daysLeft > 15) {
        alert(`Your software license is expiring soon (${licenseInfo.daysLeft} days left). Please renew your license.`);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActivePage('dashboard');
  };

  const handleNavigate = (page) => {
    setActivePage(page);
  };

  const handleProfileUpdate = (updated) => {
    setUser(prev => ({ ...prev, ...updated }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)' }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  // License expired — show locked renewal screen regardless of login state
  if (licenseInfo?.status === 'expired') {
    return (
      <ToastProvider>
        <LicenseRenewalPage licenseInfo={licenseInfo} onRenewed={() => setLicenseInfo({ ...licenseInfo, status: 'valid', daysLeft: 365 })} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      {!user
        ? <LoginPage onLogin={handleLogin} />
        : <AppShell
          user={user}
          licenseInfo={licenseInfo}
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onProfileUpdate={handleProfileUpdate}
        />
      }
    </ToastProvider>
  );
}
