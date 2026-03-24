import React from 'react';

export default function BackButton({ onClick, label = 'Voltar' }) {
  return (
    <button className="back-btn" onClick={onClick} aria-label={label}>
      <span className="back-btn-icon">←</span>
      <span className="back-btn-label">{label}</span>
    </button>
  );
}
