import React, { useState } from 'react';

export default function Settings({ profile, setProfile, setLogs, showToast }) {
  const [form, setForm] = useState({ ...profile });
  const [confirmReset, setConfirmReset] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    setProfile({ ...profile, ...form });
    showToast('Settings saved ✅');
  };

  const handleReset = () => {
    localStorage.clear();
    setLogs({});
    setProfile(null);
    window.location.reload();
  };

  const handleExport = () => {
    const data = {
      profile: JSON.parse(localStorage.getItem('lt_profile') || '{}'),
      logs: JSON.parse(localStorage.getItem('lt_logs') || '{}'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leantrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Data exported ✅');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.profile) localStorage.setItem('lt_profile', JSON.stringify(data.profile));
        if (data.logs) localStorage.setItem('lt_logs', JSON.stringify(data.logs));
        showToast('Data imported! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showToast('Invalid file format', 'error');
      }
    };
    reader.readAsText(file);
  };

  const ACTIVITY_OPTS = [
    { id: 'sedentary', label: 'Sedentary', multiplier: 1.2 },
    { id: 'light', label: 'Lightly Active', multiplier: 1.375 },
    { id: 'moderate', label: 'Moderately Active', multiplier: 1.55 },
    { id: 'very', label: 'Very Active', multiplier: 1.725 },
  ];

  const actMult = ACTIVITY_OPTS.find(a => a.id === form.activity)?.multiplier || 1.55;
  const bmr = form.sex === 'male'
    ? 10 * (parseFloat(form.currentWeight) * (form.unit === 'lbs' ? 0.453592 : 1)) + 6.25 * parseFloat(form.heightCm) - 5 * parseFloat(form.age) + 5
    : 10 * (parseFloat(form.currentWeight) * (form.unit === 'lbs' ? 0.453592 : 1)) + 6.25 * parseFloat(form.heightCm) - 5 * parseFloat(form.age) - 161;
  const tdee = Math.round(bmr * actMult);
  const dailyCalories = Math.max(1200, tdee - parseInt(form.deficitLevel || 500));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Update your profile and preferences</p>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Profile</div>
            <div className="input-group">
              <label className="input-label">Name</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Current weight ({form.unit})</label>
              <input className="input" type="number" step="0.1" value={form.currentWeight} onChange={e => set('currentWeight', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Target weight ({form.unit})</label>
              <input className="input" type="number" step="0.1" value={form.targetWeight} onChange={e => set('targetWeight', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Height (cm)</label>
              <input className="input" type="number" value={form.heightCm} onChange={e => set('heightCm', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Age</label>
              <input className="input" type="number" value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Calorie target</div>
            <div className="input-group">
              <label className="input-label">Activity level</label>
              <select className="input" value={form.activity} onChange={e => set('activity', e.target.value)}>
                {ACTIVITY_OPTS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Daily deficit: {form.deficitLevel} kcal</label>
              <input type="range" min="200" max="1000" step="50" value={form.deficitLevel}
                onChange={e => set('deficitLevel', e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
            <div className="ai-result-box" style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>TDEE</span>
                <span style={{ fontWeight: 700 }}>{tdee} kcal</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>New daily target</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{dailyCalories} kcal</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">AI food scanning</div>
            <div className="input-group">
              <label className="input-label">OpenAI API Key</label>
              <input className="input" type="password" value={form.openaiKey || ''} onChange={e => set('openaiKey', e.target.value)} placeholder="sk-..." />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Stored locally on your device only. Never sent to any server except OpenAI.{' '}
                <a href="https://platform.openai.com/api-keys" style={{ color: 'var(--accent)' }} target="_blank" rel="noreferrer">Get a key →</a>
              </span>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Data management</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-secondary" onClick={handleExport} style={{ width: '100%', justifyContent: 'center' }}>
                📦 Export all data (JSON)
              </button>
              <label className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}>
                📥 Import backup
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              </label>
            </div>
          </div>

          <div className="card" style={{ borderColor: 'rgba(248,113,113,0.2)' }}>
            <div className="card-title" style={{ color: 'var(--danger)' }}>Danger zone</div>
            {!confirmReset ? (
              <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setConfirmReset(true)}>
                Reset all data
              </button>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                  This will delete all your logs and settings permanently. Are you sure?
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => setConfirmReset(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button className="btn btn-danger" onClick={handleReset} style={{ flex: 1, justifyContent: 'center' }}>Yes, reset everything</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-primary" style={{ minWidth: 160, justifyContent: 'center' }} onClick={handleSave}>
          Save changes
        </button>
      </div>
    </div>
  );
}
