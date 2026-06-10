import React, { useState, useRef } from 'react';
import CalorieRing from '../components/CalorieRing';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Other'];

const QUICK_FOODS = [
  { name: 'Apple', calories: 95, emoji: '🍎' },
  { name: 'Banana', calories: 105, emoji: '🍌' },
  { name: 'Coffee (black)', calories: 2, emoji: '☕' },
  { name: 'Greek Yogurt (small)', calories: 100, emoji: '🥛' },
  { name: 'White Toast (1 slice)', calories: 80, emoji: '🍞' },
  { name: 'Chicken breast (100g)', calories: 165, emoji: '🍗' },
  { name: 'Brown rice (1 cup)', calories: 215, emoji: '🍚' },
  { name: 'Salad (side)', calories: 50, emoji: '🥗' },
  { name: 'Gin & Soda', calories: 110, emoji: '🍹' },
  { name: 'Pizza slice', calories: 285, emoji: '🍕' },
];

async function scanFoodWithOpenAI(base64Image, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
            {
              type: 'text',
              text: `Analyze this food image and respond ONLY with valid JSON in this exact format:
{
  "items": [
    { "name": "food item name", "calories": 250, "portion": "1 cup" }
  ],
  "totalCalories": 250,
  "confidence": "high",
  "notes": "brief notes about portion estimates"
}

Be specific about portions. Estimate calories conservatively. If you can't determine the food, set confidence to "low".`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse response');
  return JSON.parse(jsonMatch[0]);
}

export default function DailyLog({ profile, today, todayLog, updateDayLog, addMealEntry, removeMealEntry, showToast }) {
  const [tab, setTab] = useState('log');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [manualForm, setManualForm] = useState({ name: '', calories: '', mealType: 'Breakfast', notes: '' });
  const [dragging, setDragging] = useState(false);
  const [weightInput, setWeightInput] = useState(todayLog.weight ? String(todayLog.weight) : '');
  const [stepsInput, setStepsInput] = useState(todayLog.steps ? String(todayLog.steps) : '');
  const fileRef = useRef();

  const meals = todayLog.meals || [];
  const totalCals = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const remaining = profile.dailyCalories - totalCals;

  const handlePhotoFile = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setScanResult(null);
    setScanError(null);
    const reader = new FileReader();
    reader.onload = e => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handlePhotoFile(file);
  };

  const handleScan = async () => {
    if (!profile.openaiKey) {
      setScanError('No OpenAI API key set. Go to Settings to add one.');
      return;
    }
    if (!photoFile) return;
    setScanning(true);
    setScanError(null);
    try {
      const base64 = photoPreview.split(',')[1];
      const result = await scanFoodWithOpenAI(base64, profile.openaiKey);
      setScanResult(result);
    } catch (e) {
      setScanError(e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleAddScanned = () => {
    if (!scanResult) return;
    const mealType = manualForm.mealType;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const names = scanResult.items.map(i => i.name).join(', ');
    addMealEntry(today, {
      name: names,
      calories: scanResult.totalCalories,
      mealType,
      time,
      fromPhoto: true,
      items: scanResult.items,
      notes: scanResult.notes,
    });
    showToast(`Added ${scanResult.totalCalories} kcal from photo scan 📸`);
    setPhotoFile(null);
    setPhotoPreview(null);
    setScanResult(null);
  };

  const handleAddManual = () => {
    if (!manualForm.name || !manualForm.calories) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    addMealEntry(today, {
      name: manualForm.name,
      calories: parseInt(manualForm.calories),
      mealType: manualForm.mealType,
      time,
      notes: manualForm.notes,
    });
    showToast(`Logged ${manualForm.calories} kcal ✅`);
    setManualForm({ name: '', calories: '', mealType: 'Breakfast', notes: '' });
  };

  const handleQuickAdd = (food) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    addMealEntry(today, {
      name: food.name,
      calories: food.calories,
      mealType: 'Snack',
      time,
      emoji: food.emoji,
    });
    showToast(`Added ${food.name} (${food.calories} kcal) ✅`);
  };

  const saveVitals = () => {
    const data = {};
    if (weightInput) data.weight = parseFloat(weightInput);
    if (stepsInput) data.steps = parseInt(stepsInput);
    if (Object.keys(data).length) {
      updateDayLog(today, data);
      showToast('Vitals saved ✅');
    }
  };

  const mealsByType = MEAL_TYPES.reduce((acc, t) => {
    acc[t] = meals.filter((m, i) => m.mealType === t).map((m, li) => ({ ...m, origIdx: meals.indexOf(m) }));
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Log Today</h1>
        <p className="page-sub">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <CalorieRing current={totalCals} target={profile.dailyCalories} size={130} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: remaining < 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
              {remaining >= 0 ? `${remaining} kcal remaining` : `${Math.abs(remaining)} kcal over budget`}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Today's vitals</div>
          <div className="input-group">
            <label className="input-label">Weight ({profile.unit})</label>
            <input
              className="input" type="number" step="0.1"
              placeholder={`e.g. ${profile.currentWeight}`}
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 12 }}>
            <label className="input-label">Steps today</label>
            <input
              className="input" type="number"
              placeholder="e.g. 10631"
              value={stepsInput}
              onChange={e => setStepsInput(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveVitals}>
            Save vitals
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'log', label: '📸 Photo scan' },
            { id: 'manual', label: '✏️ Manual entry' },
            { id: 'quick', label: '⚡ Quick add' },
          ].map(t => (
            <button key={t.id} className="btn" onClick={() => setTab(t.id)} style={{
              background: tab === t.id ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.06)',
              border: tab === t.id ? '1px solid var(--accent)' : '1px solid var(--border)',
              color: tab === t.id ? 'var(--accent)' : 'var(--text)',
              fontSize: 13,
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'log' && (
          <div>
            <div
              className={`photo-upload-area ${dragging ? 'dragging' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Food" style={{ maxHeight: 200, borderRadius: 8, maxWidth: '100%' }} />
              ) : (
                <div>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Take or upload a food photo</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click to browse or drag & drop</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handlePhotoFile(e.target.files[0])} />

            {photoPreview && !scanResult && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                  <select className="input" value={manualForm.mealType} onChange={e => setManualForm(f => ({ ...f, mealType: e.target.value }))}>
                    {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" onClick={handleScan} disabled={scanning}>
                  {scanning ? <div className="spinner" /> : '🔍 Scan with AI'}
                </button>
              </div>
            )}

            {scanError && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--danger)' }}>
                ⚠️ {scanError}
              </div>
            )}

            {scanResult && (
              <div className="ai-result-box">
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  AI found {scanResult.items.length} item{scanResult.items.length > 1 ? 's' : ''} — {scanResult.totalCalories} kcal total
                  <span className="badge badge-accent" style={{ marginLeft: 8, fontSize: 11 }}>{scanResult.confidence} confidence</span>
                </div>
                {scanResult.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                    <span>{item.name} <span style={{ color: 'var(--text-muted)' }}>({item.portion})</span></span>
                    <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{item.calories} kcal</span>
                  </div>
                ))}
                {scanResult.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{scanResult.notes}</div>}
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleAddScanned}>
                  ✅ Add to today's log
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'manual' && (
          <div>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Food / meal name</label>
                <input className="input" placeholder="e.g. Chicken rice bowl" value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Calories (kcal)</label>
                <input className="input" type="number" placeholder="e.g. 450" value={manualForm.calories} onChange={e => setManualForm(f => ({ ...f, calories: e.target.value }))} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Meal type</label>
              <select className="input" value={manualForm.mealType} onChange={e => setManualForm(f => ({ ...f, mealType: e.target.value }))}>
                {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Notes (optional)</label>
              <input className="input" placeholder="e.g. at the mall, with salsa" value={manualForm.notes} onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleAddManual}
              disabled={!manualForm.name || !manualForm.calories}
            >
              + Add to log
            </button>
          </div>
        )}

        {tab === 'quick' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {QUICK_FOODS.map(food => (
                <button key={food.name} onClick={() => handleQuickAdd(food)} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.15s',
                }} onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                  <span style={{ fontSize: 22 }}>{food.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{food.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{food.calories} kcal</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Today's food log — {totalCals} kcal total</div>
        {meals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            No meals logged yet. Add your first entry above 👆
          </div>
        )}
        {MEAL_TYPES.map(type => {
          const typeMeals = meals.map((m, i) => ({ ...m, idx: i })).filter(m => m.mealType === type);
          if (typeMeals.length === 0) return null;
          const typeCals = typeMeals.reduce((s, m) => s + (m.calories || 0), 0);
          return (
            <div key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 6px', borderBottom: '1px solid var(--border)' }}>
                <span className="meal-section-header" style={{ margin: 0 }}>{type}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{typeCals} kcal</span>
              </div>
              {typeMeals.map(m => (
                <div key={m.idx} className="food-item">
                  <span className="food-emoji">{m.emoji || (m.fromPhoto ? '📸' : '🍴')}</span>
                  <div className="food-info">
                    <div className="food-name">{m.name}</div>
                    <div className="food-time">{m.time}{m.notes ? ` · ${m.notes}` : ''}</div>
                  </div>
                  <span className="food-cals">{m.calories}</span>
                  <button onClick={() => removeMealEntry(today, m.idx)} style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '4px 8px',
                  }}>✕</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
