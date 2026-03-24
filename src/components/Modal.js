import React from 'react';

export default function Modal({ open, onClose, title, children, size = 'normal' }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-box modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">{title}</h2>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
