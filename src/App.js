import React, { useState, useEffect } from 'react';
import './index.css';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import WeeklyView from './pages/WeeklyView';
import Settings from './pages/Settings';
import Toast from './components/Toast';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'log', label: 'Log Today', icon: '🍽️' },
  { id: 'weekly', label: 'Weekly View', icon: '📅' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [profile, setProfile] = useState(() => {
    const s = localStorage.getItem('lt_profile');
    return s ? JSON.parse(s) : null;
  });

  const [logs, setLogs] = useState(() => {
    const s = localStorage.getItem('lt_logs');
    return s ? JSON.parse(s) : {};
  });

  const [page, setPage] = useState('dashboard');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (profile) localStorage.setItem('lt_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('lt_logs', JSON.stringify(logs));
  }, [logs]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateDayLog = (date, data) => {
    setLogs(prev => ({
      ...prev,
      [date]: { ...(prev[date] || {}), ...data }
    }));
  };

  const addMealEntry = (date, entry) => {
    setLogs(prev => {
      const day = prev[date] || {};
      const meals = day.meals || [];
      return { ...prev, [date]: { ...day, meals: [...meals, entry] } };
    });
  };

  const removeMealEntry = (date, idx) => {
    setLogs(prev => {
      const day = prev[date] || {};
      const meals = (day.meals || []).filter((_, i) => i !== idx);
      return { ...prev, [date]: { ...day, meals } };
    });
  };

  if (!profile) {
    return (
      <>
        <Onboarding onComplete={(p) => { setProfile(p); showToast('Profile saved! Let\'s go 💪'); }} />
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </>
    );
  }

  const today = getToday();
  const todayLog = logs[today] || {};

  const renderPage = () => {
    const props = { profile, logs, today, todayLog, updateDayLog, addMealEntry, removeMealEntry, showToast, setPage };
    switch (page) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'log': return <DailyLog {...props} />;
      case 'weekly': return <WeeklyView {...props} />;
      case 'settings': return <Settings {...props} setProfile={setProfile} setLogs={setLogs} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span>🔥</span> LeanTrack
        </div>
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => setPage(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 12px' }}>
            Goal: {profile.targetWeight}{profile.unit}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 12px' }}>
            Daily target: {profile.dailyCalories} kcal
          </div>
        </div>
      </nav>
      <main className="main-content">
        {renderPage()}
      </main>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
