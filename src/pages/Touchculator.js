import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import { generateTouchculatorQuestion, getOperationSymbol, getOperationLabel } from '../utils/questionGenerator';
import './Touchculator.css';

const OPERATIONS = ['addition', 'subtraction', 'multiplication', 'division'];

function getVisualCount(question, operation, step) {
  switch (operation) {
    case 'addition':
      return question.a + step;
    case 'subtraction':
      return Math.max(question.a - step, 0);
    case 'multiplication':
      return question.a * (step + 1);
    case 'division':
      return Math.max(question.a - question.b * step, question.answer);
    default:
      return question.a + step;
  }
}

function getTargetSteps(question, operation) {
  switch (operation) {
    case 'addition':
    case 'subtraction':
      return question.b;
    case 'multiplication':
      return question.b - 1;
    case 'division':
      return Math.max(0, question.a / question.b - 1);
    default:
      return question.b;
  }
}

export default function Touchculator() {
  const navigate = useNavigate();
  const [selectedOp, setSelectedOp] = useState(null);
  const [question, setQuestion] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const startGame = (op) => {
    const q = generateTouchculatorQuestion(op);
    setSelectedOp(op);
    setQuestion(q);
    setCurrentStep(0);
    setShowModal(false);
  };

  const handleTap = () => {
    if (!question) return;
    const targetSteps = getTargetSteps(question, selectedOp);
    if (currentStep >= targetSteps) return;

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    if (nextStep === targetSteps) {
      setTimeout(() => setShowModal(true), 300);
    }
  };

  const handleReset = () => {
    setShowModal(false);
    if (selectedOp) startGame(selectedOp);
  };

  const handleBack = () => {
    setSelectedOp(null);
    setQuestion(null);
    setCurrentStep(0);
    setShowModal(false);
  };

  if (!selectedOp) {
    return (
      <div className="page touchculator-landing-page compact-page">
        <BackButton onClick={() => navigate('/menu')} />
        <div className="touchculator-landing compact-shell">
          <span className="tc-emoji">🧮</span>
          <h2>Touchculator</h2>
          <p>Escolhe uma operação!</p>
          <div className="op-grid">
            {OPERATIONS.map((op) => (
              <button key={op} className="op-btn" onClick={() => startGame(op)} data-op={op}>
                <span className="op-symbol">{getOperationSymbol(op)}</span>
                <span className="op-label">{getOperationLabel(op)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const visualCount = question ? getVisualCount(question, selectedOp, currentStep) : 0;
  const targetSteps = question ? getTargetSteps(question, selectedOp) : 0;

  return (
    <div className="page touchculator-game-page compact-page">
      <BackButton onClick={handleBack} />
      <button type="button" className="tc-game tc-tap-surface" onClick={handleTap}>
        <div className="tc-op-badge">{getOperationSymbol(selectedOp)}</div>
        <div className="tc-question">
          <span className="tc-a">{question.a}</span>
          <span className="tc-op">{getOperationSymbol(selectedOp)}</span>
          <span className="tc-b">{question.b}</span>
          <span className="tc-eq">=</span>
          <span className="tc-target">?</span>
        </div>

        <div className="circles-area">
          {Array.from({ length: visualCount }, (_, i) => (
            <div key={i} className="circle" />
          ))}
        </div>

        <div className="tc-counter">
          <span className="tc-current">{currentStep}/{targetSteps}</span>
          <span className="tc-hint">Toque para avançar</span>
        </div>
      </button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="🎉 Parabéns! 🎉">
        <p className="tc-result">
          {question.a} {getOperationSymbol(selectedOp)} {question.b} = <strong>{question.answer}</strong>
        </p>
        <div className="modal-btns">
          <button className="big-btn" onClick={handleReset}>Repetir 🔄</button>
          <button className="big-btn" onClick={handleBack}>Voltar 📚</button>
        </div>
      </Modal>
    </div>
  );
}
