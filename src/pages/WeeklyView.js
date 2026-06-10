import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function getWeeks(logs) {
  const weeks = {};
  Object.keys(logs).forEach(date => {
    const ws = getWeekStart(date);
    if (!weeks[ws]) weeks[ws] = [];
    weeks[ws].push({ date, ...logs[date] });
  });
  return Object.entries(weeks)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([weekStart, days]) => {
      const totalCals = days.reduce((s, d) => s + ((d.meals || []).reduce((ms, m) => ms + (m.calories || 0), 0)), 0);
      const totalSteps = days.reduce((s, d) => s + (d.steps || 0), 0);
      const weightEntries = days.filter(d => d.weight).sort((a, b) => a.date.localeCompare(b.date));
      const startWeight = weightEntries[0]?.weight || null;
      const endWeight = weightEntries[weightEntries.length - 1]?.weight || null;
      const weightChange = (startWeight && endWeight) ? +(endWeight - startWeight).toFixed(2) : null;
      const loggedDays = days.filter(d => (d.meals || []).length > 0 || d.steps || d.weight).length;
      const avgCalories = loggedDays > 0 ? Math.round(totalCals / days.filter(d => (d.meals || []).length > 0).length) : 0;
      const daysOver = days.filter(d => {
        const dc = (d.meals || []).reduce((s, m) => s + (m.calories || 0), 0);
        return dc > 0;
      }).length;

      return {
        weekStart,
        days: days.sort((a, b) => a.date.localeCompare(b.date)),
        totalCals,
        totalSteps,
        startWeight,
        endWeight,
        weightChange,
        loggedDays,
        avgCalories,
        daysLogged: days.filter(d => (d.meals || []).length > 0).length,
        label: `Week of ${new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      };
    });
}

export default function WeeklyView({ profile, logs, today }) {
  const [openWeek, setOpenWeek] = useState(null);
  const weeks = getWeeks(logs);

  if (weeks.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Weekly View</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No data yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Start logging food and activity to see your weekly summaries here.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Weekly View</h1>
        <p className="page-sub">Your week-by-week progress</p>
      </div>

      {weeks.map(week => {
        const isOpen = openWeek === week.weekStart;
        const dayData = week.days.map(d => {
          const cals = (d.meals || []).reduce((s, m) => s + (m.calories || 0), 0);
          return {
            label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
            calories: cals,
            steps: d.steps || 0,
            weight: d.weight,
          };
        });

        const wtUnit = profile.unit;
        const wtChange = week.weightChange;
        const wtDisplay = wtChange !== null
          ? (wtUnit === 'lbs' ? (wtChange * 2.20462).toFixed(1) : wtChange.toFixed(1))
          : null;

        return (
          <div key={week.weekStart} style={{ marginBottom: 12 }}>
            <div
              className="week-row"
              onClick={() => setOpenWeek(isOpen ? null : week.weekStart)}
              style={{ justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{week.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {week.daysLogged} days logged · avg {week.avgCalories || '—'} kcal/day
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {wtDisplay !== null && (
                  <span className={`badge ${parseFloat(wtDisplay) < 0 ? 'badge-success' : parseFloat(wtDisplay) > 0 ? 'badge-danger' : 'badge-accent'}`}>
                    {parseFloat(wtDisplay) > 0 ? '+' : ''}{wtDisplay} {wtUnit}
                  </span>
                )}
                <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {isOpen && (
              <div className="card" style={{ marginTop: -8, borderRadius: '0 0 12px 12px', borderTop: 'none' }}>
                <div className="grid-4" style={{ marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL CALORIES</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{week.totalCals.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>target {profile.dailyCalories * 7}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>TOTAL STEPS</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{week.totalSteps.toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>goal 70,000/wk</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>WEIGHT CHANGE</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: wtDisplay && parseFloat(wtDisplay) < 0 ? 'var(--success)' : wtDisplay && parseFloat(wtDisplay) > 0 ? 'var(--danger)' : 'var(--text)' }}>
                      {wtDisplay !== null ? `${parseFloat(wtDisplay) > 0 ? '+' : ''}${wtDisplay} ${wtUnit}` : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>DAYS LOGGED</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{week.daysLogged}/7</div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(v, n) => [`${v} kcal`, 'Calories']}
                    />
                    <ReferenceLine y={profile.dailyCalories} stroke="#22d3ee" strokeDasharray="4 2" />
                    <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                      {dayData.map((d, i) => (
                        <Cell key={i} fill={d.calories > profile.dailyCalories ? '#f87171' : d.calories > 0 ? '#22d3ee' : '#334155'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div style={{ marginTop: 20 }}>
                  <div className="card-title">Daily breakdown</div>
                  {week.days.map(d => {
                    const cals = (d.meals || []).reduce((s, m) => s + (m.calories || 0), 0);
                    const isToday = d.date === today;
                    return (
                      <div key={d.date} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '10px 0', borderBottom: '1px solid var(--border)',
                      }}>
                        <div style={{ minWidth: 80 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? 'var(--accent)' : 'var(--text)' }}>
                            {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {isToday && <span style={{ fontSize: 10, marginLeft: 4, color: 'var(--accent)' }}>TODAY</span>}
                          </div>
                          {d.weight && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {profile.unit === 'lbs' ? (d.weight * 2.20462).toFixed(1) : d.weight} {profile.unit}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          {(d.meals || []).length > 0 ? (
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                              {(d.meals || []).map((m, i) => (
                                <span key={i}>
                                  {m.name} <span style={{ color: 'var(--accent)', fontWeight: 600 }}>({m.calories})</span>
                                  {i < d.meals.length - 1 ? ' · ' : ''}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.4)' }}>No meals logged</span>
                          )}
                        </div>
                        <div style={{ minWidth: 70, textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: cals > profile.dailyCalories ? 'var(--danger)' : cals > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                            {cals > 0 ? `${cals}` : '—'}
                          </div>
                          {d.steps > 0 && <div style={{ fontSize: 12, color: d.steps >= 10000 ? 'var(--success)' : 'var(--text-muted)' }}>{d.steps.toLocaleString()} steps</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 20, padding: 16, background: 'rgba(167,139,250,0.08)', borderRadius: 8, border: '1px solid rgba(167,139,250,0.2)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: '#a78bfa' }}>📝 Week summary</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    {week.avgCalories > 0 && week.avgCalories <= profile.dailyCalories && (
                      <div>✅ Averaged <strong style={{ color: 'var(--text)' }}>{week.avgCalories} kcal/day</strong> — within your {profile.dailyCalories} kcal target.</div>
                    )}
                    {week.avgCalories > profile.dailyCalories && (
                      <div>⚠️ Averaged <strong style={{ color: 'var(--danger)' }}>{week.avgCalories} kcal/day</strong> — {week.avgCalories - profile.dailyCalories} kcal over your target.</div>
                    )}
                    {week.totalSteps > 0 && (
                      <div>🚶 {week.totalSteps.toLocaleString()} steps total · {Math.round(week.totalSteps / week.days.length).toLocaleString()} avg/day {week.totalSteps / week.days.length >= 10000 ? '🔥' : ''}</div>
                    )}
                    {wtDisplay !== null && (
                      <div>{parseFloat(wtDisplay) < 0 ? `⬇️ Lost ${Math.abs(parseFloat(wtDisplay))} ${wtUnit} this week.` : parseFloat(wtDisplay) > 0 ? `⬆️ Gained ${parseFloat(wtDisplay)} ${wtUnit} this week.` : '➡️ Weight held steady this week.'}</div>
                    )}
                    {week.daysLogged < 5 && <div>💡 Logged {week.daysLogged}/7 days — try for 7 next week.</div>}
                    {week.daysLogged >= 6 && <div>🌟 Great consistency — {week.daysLogged}/7 days logged!</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
