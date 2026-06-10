import React from 'react';

export default function CalorieRing({ current, target, size = 140 }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, current / Math.max(1, target));
  const offset = circumference - pct * circumference;
  const over = current > target;

  return (
    <div className="calorie-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={over ? '#f87171' : '#22d3ee'}
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={Math.max(0, offset)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {over && (
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(248,113,113,0.3)"
            strokeWidth={10}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (pct - 1) * circumference}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="calorie-ring-center">
        <div className="calorie-ring-num" style={{ color: over ? '#f87171' : '#f1f5f9' }}>{current}</div>
        <div className="calorie-ring-label">of {target}</div>
        <div style={{ fontSize: 11, marginTop: 2, color: over ? '#f87171' : '#4ade80', fontWeight: 600 }}>
          {over ? 'over' : 'kcal'}
        </div>
      </div>
    </div>
  );
}
