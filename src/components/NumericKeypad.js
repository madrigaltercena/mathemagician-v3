import React from 'react';

export default function NumericKeypad({ value, onChange, onSubmit, canSubmit = true, maxLength = 4 }) {
  const appendDigit = (digit) => {
    const current = String(value ?? '');
    if (current.length >= maxLength) return;
    const next = current === '0' ? String(digit) : `${current}${digit}`;
    onChange(next);
  };

  const backspace = () => {
    const current = String(value ?? '');
    onChange(current.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="numeric-keypad" aria-label="Teclado numérico no ecrã">
      <div className="numeric-keypad-grid">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            className="keypad-btn"
            onClick={() => appendDigit(key)}
          >
            {key}
          </button>
        ))}
        <button type="button" className="keypad-btn keypad-secondary" onClick={backspace}>
          ⌫
        </button>
        <button type="button" className="keypad-btn" onClick={() => appendDigit('0')}>
          0
        </button>
        <button
          type="button"
          className="keypad-btn keypad-confirm"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
