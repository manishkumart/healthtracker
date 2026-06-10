import React from 'react';

export default function Toast({ msg, type = 'success' }) {
  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  return (
    <div className="toast">
      <span>{icon}</span>
      <span>{msg}</span>
    </div>
  );
}
