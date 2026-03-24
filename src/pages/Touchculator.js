import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import { generateTouchculatorQuestion, getOperationSymbol, getOperationLabel } from '../utils/questionGenerator';
import './Touchculator.css';

const OPERATIONS = ['addition', 'subtraction', 'multiplication', 'division'];

export default function Touchculator() {
  const navigate = useNavigate();
  const [selectedOp, setSelectedOp] = useState(null);
  const [question, setQuestion] = useState(null);
  const [currentValue, setCurrentValue] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [circles, setCircles] = useState([]);

  const startGame = (op) => {
    const q = generateTouchculatorQuestion(op);
    setSelectedOp(op);
    setQuestion(q);
    setCurrentValue(0);
    setCircles(Array.from({ length: q.a }, (_, i) => i));
  };

  const handleTap = useCallback(() => {
    const target = question.answer;
    if (currentValue >= target) return;

    const next = currentValue + 1;
    setCurrentValue(next);

    if (next <= question.a) {
      setCircles(Array.from({ length: next }, (_, i) => i));
    }

    if (next === target) {
      setTimeout(() => setShowModal(true), 400);
    }
  }, [currentValue, question]);

  const handleReset = () => {
    setShowModal(false);
    if (selectedOp) {
      const q = generateTouchculatorQuestion(selectedOp);
      setQuestion(q);
      setCurrentValue(0);
      setCircles(Array.from({ length: q.a }, (_, i) => i));
    }
  };

  const handleBack = () => {
    setSelectedOp(null);
    setQuestion(null);
    setCurrentValue(0);
    setCircles([]);
    setShowModal(false);
  };

  if (!selectedOp) {
    return (
      <div className="page touchculator-landing-page">
        <BackButton onClick={() => navigate('/menu')} />
        <div className="touchculator-landing">
          <span className="tc-emoji">🧮</span>
          <h2>Touchculator</h2>
          <p>Escolhe uma operação!</p>
          <div className="op-grid">
            {OPERATIONS.map((op) => (
              <button
                key={op}
                className="op-btn"
                onClick={() => startGame(op)}
                data-op={op}
              >
                <span className="op-symbol">{getOperationSymbol(op)}</span>
                <span className="op-label">{getOperationLabel(op)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page touchculator-game-page" onClick={handleTap}>
      <BackButton onClick={handleBack} />
      <div className="tc-game">
        <div className="tc-op-badge">{getOperationSymbol(selectedOp)}</div>
        <div className="tc-question">
          <span className="tc-a">{question.a}</span>
          <span className="tc-op">{getOperationSymbol(selectedOp)}</span>
          <span className="tc-b">{question.b}</span>
          <span className="tc-eq">=</span>
          <span className="tc-target">?</span>
        </div>

        <div className="circles-area">
          {circles.map((i) => (
            <div key={i} className="circle" />
          ))}
        </div>

        <div className="tc-counter">
          <span className="tc-current">{currentValue}</span>
          <span className="tc-hint">Toque para +1</span>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="🎉 Parabéns! 🎉"
      >
        <p className="tc-result">
          {question.a} {getOperationSymbol(selectedOp)} {question.b} = <strong>{question.answer}</strong>
        </p>
        <div className="modal-btns">
          <button className="big-btn" onClick={handleReset}>
            Repetir 🔄
          </button>
          <button className="big-btn" onClick={handleBack}>
            Voltar 📚
          </button>
        </div>
      </Modal>
    </div>
  );
}
