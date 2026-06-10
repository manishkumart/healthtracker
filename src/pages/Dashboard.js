import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import CalorieRing from '../components/CalorieRing';

function getWeekDays(logs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const log = logs[key] || {};
    const cals = (log.meals || []).reduce((s, m) => s + (m.calories || 0), 0);
    days.push({
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      calories: cals,
      steps: log.steps || 0,
      weight: log.weight || null,
    });
  }
  return days;
}

function getWeightHistory(logs, unit) {
  const entries = Object.entries(logs)
    .filter(([, v]) => v.weight)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: unit === 'lbs' ? parseFloat((v.weight * 2.20462).toFixed(1)) : parseFloat(v.weight),
    }));
  return entries;
}

function getStreakDays(logs) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const log = logs[key] || {};
    if ((log.meals || []).length > 0 || log.steps || log.weight) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function Dashboard({ profile, logs, today, todayLog, setPage }) {
  const weekDays = getWeekDays(logs);
  const todayCals = (todayLog.meals || []).reduce((s, m) => s + (m.calories || 0), 0);
  const weightHistory = getWeightHistory(logs, profile.unit);
  const streak = getStreakDays(logs);

  const currentWeightKg = Object.entries(logs)
    .filter(([, v]) => v.weight)
    .sort(([a], [b]) => b.localeCompare(a))[0]?.[1]?.weight || null;

  const startWeightKg = parseFloat(profile.currentWeight) * (profile.unit === 'lbs' ? 0.453592 : 1);
  const targetWeightKg = parseFloat(profile.targetWeight) * (profile.unit === 'lbs' ? 0.453592 : 1);

  const currentDisplay = currentWeightKg
    ? (profile.unit === 'lbs' ? (currentWeightKg * 2.20462).toFixed(1) : currentWeightKg.toFixed(1))
    : profile.currentWeight;

  const lostKg = currentWeightKg ? Math.max(0, startWeightKg - currentWeightKg) : 0;
  const lostDisplay = profile.unit === 'lbs' ? (lostKg * 2.20462).toFixed(1) : lostKg.toFixed(1);

  const toGoKg = currentWeightKg ? Math.max(0, currentWeightKg - targetWeightKg) : (startWeightKg - targetWeightKg);
  const toGoDisplay = profile.unit === 'lbs' ? (toGoKg * 2.20462).toFixed(1) : toGoKg.toFixed(1);

  const totalToLoseKg = startWeightKg - targetWeightKg;
  const progressPct = totalToLoseKg > 0 ? Math.min(100, Math.round((lostKg / totalToLoseKg) * 100)) : 0;

  const avgWeekCalories = Math.round(
    weekDays.reduce((s, d) => s + d.calories, 0) / weekDays.filter(d => d.calories > 0).length || 0
  );

  const totalWeekSteps = weekDays.reduce((s, d) => s + d.steps, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile.name} 👋</h1>
        <p className="page-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Current Weight</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{currentDisplay}<span style={{ fontSize: 14, fontWeight: 400 }}>{profile.unit}</span></div>
          <div className="stat-sub">Target: {profile.targetWeight}{profile.unit}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lost so far</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{lostDisplay}<span style={{ fontSize: 14, fontWeight: 400 }}>{profile.unit}</span></div>
          <div className="stat-sub">{toGoDisplay}{profile.unit} to go</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's calories</div>
          <div className="stat-value" style={{ color: todayCals > profile.dailyCalories ? 'var(--danger)' : 'var(--text)' }}>
            {todayCals}<span style={{ fontSize: 14, fontWeight: 400 }}>/{profile.dailyCalories}</span>
          </div>
          <div className="stat-sub">{Math.max(0, profile.dailyCalories - todayCals)} remaining</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Streak</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{streak}<span style={{ fontSize: 14, fontWeight: 400 }}>d</span></div>
          <div className="stat-sub">Keep it up! 🔥</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-title">Overall progress</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Start: {profile.currentWeight}{profile.unit}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Goal: {profile.targetWeight}{profile.unit}</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--accent), var(--success))' }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                {progressPct}% complete
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>{lostDisplay}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile.unit} lost</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{toGoDisplay}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{profile.unit} to go</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{Math.round(toGoKg / (parseFloat(profile.weeklyLossTarget) * (profile.unit === 'lbs' ? 2.20462 : 1)) * 7)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>est. days left</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card-title" style={{ width: '100%' }}>Today's calories</div>
          <CalorieRing current={todayCals} target={profile.dailyCalories} size={140} />
          <button
            className="btn btn-primary"
            style={{ marginTop: 16, width: '100%' }}
            onClick={() => setPage('log')}
          >
            + Log food
          </button>
        </div>
      </div>

      {weightHistory.length > 1 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Weight trend ({profile.unit})</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightHistory}>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={v => `${v}${profile.unit}`}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#22d3ee' }}
                formatter={v => [`${v} ${profile.unit}`, 'Weight']}
              />
              <ReferenceLine y={parseFloat(profile.targetWeight)} stroke="#4ade80" strokeDasharray="4 2" label={{ value: 'Goal', fill: '#4ade80', fontSize: 11 }} />
              <Line type="monotone" dataKey="weight" stroke="#22d3ee" strokeWidth={2} dot={{ fill: '#22d3ee', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div className="card-title">This week</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {weekDays.map(d => {
            const isToday = d.date === today;
            const pct = Math.min(100, (d.calories / profile.dailyCalories) * 100);
            const over = d.calories > profile.dailyCalories;
            return (
              <div key={d.date} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: isToday ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400, marginBottom: 6 }}>
                  {d.label}
                </div>
                <div style={{
                  height: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 6,
                  position: 'relative', overflow: 'hidden',
                  border: isToday ? '1px solid var(--accent)' : '1px solid transparent',
                }}>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: `${pct}%`,
                    background: over ? 'rgba(248,113,113,0.5)' : 'rgba(34,211,238,0.4)',
                    borderRadius: '0 0 4px 4px',
                    transition: 'height 0.5s',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  {d.calories > 0 ? d.calories : '—'}
                </div>
                {d.steps > 0 && (
                  <div style={{ fontSize: 10, color: d.steps >= 10000 ? 'var(--success)' : 'var(--text-muted)' }}>
                    {(d.steps / 1000).toFixed(1)}k
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Avg calories: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{avgWeekCalories || '—'}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Total steps: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{totalWeekSteps.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
