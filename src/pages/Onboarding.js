import React, { useState } from 'react';

const ACTIVITY = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise', multiplier: 1.2 },
  { id: 'light', label: 'Lightly Active', desc: '1-3 days/week', multiplier: 1.375 },
  { id: 'moderate', label: 'Moderately Active', desc: '3-5 days/week', multiplier: 1.55 },
  { id: 'very', label: 'Very Active', desc: '6-7 days/week', multiplier: 1.725 },
];

function calcBMR(weight, heightCm, age, sex) {
  if (sex === 'male') return 10 * weight + 6.25 * heightCm - 5 * age + 5;
  return 10 * weight + 6.25 * heightCm - 5 * age - 161;
}

function calcWeeklyTarget(currentKg, targetKg, weeksGoal) {
  const diff = currentKg - targetKg;
  return (diff / weeksGoal).toFixed(2);
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    unit: 'kg',
    currentWeight: '',
    targetWeight: '',
    heightCm: '',
    age: '',
    sex: 'male',
    activity: 'moderate',
    weeksGoal: 16,
    deficitLevel: 500,
    openaiKey: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const currentKg = parseFloat(form.currentWeight) * (form.unit === 'lbs' ? 0.453592 : 1);
  const targetKg = parseFloat(form.targetWeight) * (form.unit === 'lbs' ? 0.453592 : 1);
  const actMult = ACTIVITY.find(a => a.id === form.activity)?.multiplier || 1.55;
  const bmr = calcBMR(currentKg || 80, parseFloat(form.heightCm) || 170, parseFloat(form.age) || 35, form.sex);
  const tdee = Math.round(bmr * actMult);
  const dailyCalories = Math.max(1200, tdee - parseInt(form.deficitLevel));
  const weeklyLossKg = (parseInt(form.deficitLevel) * 7) / 7700;
  const weeklyLossDisplay = form.unit === 'lbs'
    ? (weeklyLossKg * 2.20462).toFixed(2)
    : weeklyLossKg.toFixed(2);

  const steps = [
    {
      title: 'Welcome to LeanTrack 🔥',
      sub: 'Your personal weight loss companion. Let\'s set you up in 3 minutes.',
      content: (
        <div>
          <div className="input-group">
            <label className="input-label">Your first name</label>
            <input className="input" placeholder="e.g. Chris" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Preferred units</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['kg', 'lbs'].map(u => (
                <button key={u} onClick={() => set('unit', u)} className="btn" style={{
                  flex: 1,
                  background: form.unit === u ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.06)',
                  border: form.unit === u ? '1px solid var(--accent)' : '1px solid var(--border)',
                  color: form.unit === u ? 'var(--accent)' : 'var(--text)',
                }}>{u.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">OpenAI API Key (for food photo scanning)</label>
            <input className="input" type="password" placeholder="sk-..." value={form.openaiKey} onChange={e => set('openaiKey', e.target.value)} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Stored locally on your device only. Get one at <a href="https://platform.openai.com/api-keys" style={{ color: 'var(--accent)' }} target="_blank" rel="noreferrer">platform.openai.com</a>
            </span>
          </div>
        </div>
      ),
      valid: form.name.trim().length > 0,
    },
    {
      title: 'Your stats',
      sub: 'Used to calculate your personal calorie targets.',
      content: (
        <div>
          <div className="grid-2" style={{ marginBottom: 0 }}>
            <div className="input-group">
              <label className="input-label">Current weight ({form.unit})</label>
              <input className="input" type="number" placeholder={form.unit === 'kg' ? '90' : '198'} value={form.currentWeight} onChange={e => set('currentWeight', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Target weight ({form.unit})</label>
              <input className="input" type="number" placeholder={form.unit === 'kg' ? '75' : '165'} value={form.targetWeight} onChange={e => set('targetWeight', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Height (cm)</label>
              <input className="input" type="number" placeholder="175" value={form.heightCm} onChange={e => set('heightCm', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Age</label>
              <input className="input" type="number" placeholder="35" value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Sex</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['male', 'female'].map(s => (
                <button key={s} onClick={() => set('sex', s)} className="btn" style={{
                  flex: 1,
                  background: form.sex === s ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.06)',
                  border: form.sex === s ? '1px solid var(--accent)' : '1px solid var(--border)',
                  color: form.sex === s ? 'var(--accent)' : 'var(--text)',
                  textTransform: 'capitalize',
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      ),
      valid: form.currentWeight && form.targetWeight && form.heightCm && form.age,
    },
    {
      title: 'Activity & deficit',
      sub: 'How active are you? This determines your maintenance calories.',
      content: (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {ACTIVITY.map(a => (
              <button key={a.id} onClick={() => set('activity', a.id)} style={{
                background: form.activity === a.id ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                border: form.activity === a.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--text)',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: form.activity === a.id ? 'var(--accent)' : 'var(--text)' }}>{a.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.desc}</div>
              </button>
            ))}
          </div>
          <div className="input-group">
            <label className="input-label">Daily calorie deficit: {form.deficitLevel} kcal/day</label>
            <input
              type="range" min="200" max="1000" step="50"
              value={form.deficitLevel}
              onChange={e => set('deficitLevel', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Gentle (200)</span><span>Aggressive (1000)</span>
            </div>
          </div>
          <div className="ai-result-box" style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Maintenance calories (TDEE)</span>
              <span style={{ fontWeight: 700 }}>{tdee} kcal</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your daily target</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{dailyCalories} kcal</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Expected weekly loss</span>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{weeklyLossDisplay} {form.unit}/wk</span>
            </div>
          </div>
        </div>
      ),
      valid: true,
    },
  ];

  const cur = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      const profile = {
        ...form,
        dailyCalories,
        tdee,
        weeklyLossTarget: weeklyLossDisplay,
        createdAt: new Date().toISOString(),
      };
      onComplete(profile);
    }
  };

  return (
    <div className="onboarding-wrap">
      <div className="onboarding-card">
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: i <= step ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{cur.title}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>{cur.sub}</p>
        {cur.content}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {step > 0 && (
            <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>
              Back
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!cur.valid}
            style={{ flex: 1, opacity: cur.valid ? 1 : 0.5, cursor: cur.valid ? 'pointer' : 'not-allowed' }}
          >
            {step === steps.length - 1 ? '🚀 Start tracking!' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
