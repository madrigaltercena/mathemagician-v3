import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import { generateTouchculatorQuestion, getOperationSymbol, getOperationLabel } from '../utils/questionGenerator';
import './Touchculator.css';

const OPERATIONS = ['addition', 'subtraction', 'multiplication', 'division'];
const FADE_OUT_MS = 220;

const SubmitState = {
  HIDDEN: 'hidden',
  READY: 'ready',
  CONFIRMED: 'confirmed',
};

const HINTS = {
  default: 'Toque em qualquer zona para avançar',
  readyToSubmit: 'Toque para submeter resultado',
  division: {
    0: 'Confirma as colunas',
    1: 'Submeter resultado',
  },
  multiplication: {
    adding: 'Adiciona um grupo',
    confirmed: 'Confirma o resultado',
  },
};

/**
 * Visual count at a given step.
 * Addition:       circles build up from a to a+b
 * Subtraction:    circles decrease from a to a-b
 */
function getVisualCount(question, operation, step) {
  switch (operation) {
    case 'addition':
      return question.a + step;
    case 'subtraction':
      return Math.max(question.a - step, question.answer);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

function getTargetSteps(question, operation) {
  switch (operation) {
    case 'addition':
      return question.b;
    case 'subtraction':
      return question.a - question.answer;
    case 'multiplication':
      return question.b;
    case 'division':
      return 2;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

function getInitialCircles(question, operation) {
  if (operation === 'division') {
    const circles = [];
    let id = 0;
    for (let col = 0; col < question.b; col++) {
      for (let row = 0; row < question.answer; row++) {
        circles.push({ id: `circle-${id++}`, state: 'visible', col });
      }
    }
    return circles;
  }

  if (operation === 'multiplication') {
    return Array.from({ length: question.a }, (_, i) => ({
      id: `circle-${i}`,
      state: 'visible',
      row: 0,
    }));
  }

  return Array.from({ length: question.a }, (_, i) => ({
    id: `circle-${i}`,
    state: 'visible',
  }));
}

function circleDelta(currentCount, nextCount) {
  return nextCount - currentCount;
}

export default function Touchculator() {
  const navigate = useNavigate();
  const [selectedOp, setSelectedOp] = useState(null);
  const [question, setQuestion] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitState, setSubmitState] = useState(SubmitState.HIDDEN);
  const [multiplicationConfirmed, setMultiplicationConfirmed] = useState(false);
  const [circles, setCircles] = useState([]);

  const questionRef = useRef(null);
  const selectedOpRef = useRef(null);
  const isTappingRef = useRef(false);
  const fadeTimeoutRef = useRef(null);
  const tapTimeoutsRef = useRef([]);

  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => { selectedOpRef.current = selectedOp; }, [selectedOp]);

  const releaseTap = useCallback((delay = 80) => {
    const timeoutId = setTimeout(() => {
      isTappingRef.current = false;
      tapTimeoutsRef.current = tapTimeoutsRef.current.filter((id) => id !== timeoutId);
    }, delay);
    tapTimeoutsRef.current.push(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      tapTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      tapTimeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!questionRef.current || !selectedOpRef.current) return;
    if (currentStep === 0) return;

    const op = selectedOpRef.current;
    if (op === 'division' || op === 'multiplication') return;

    const q = questionRef.current;
    const nextCount = getVisualCount(q, op, currentStep);

    setCircles((prev) => {
      const visible = prev.filter((c) => c.state !== 'leaving');
      const currentCount = visible.length;
      const delta = circleDelta(currentCount, nextCount);

      if (delta === 0) return prev;

      if (delta > 0) {
        const additions = Array.from({ length: delta }, (_, i) => ({
          id: `circle-${currentCount + i}-${Date.now()}`,
          state: 'entering',
        }));
        return [...visible, ...additions];
      }

      const removeCount = Math.abs(delta);
      const next = [...visible];
      for (let i = 0; i < removeCount && i < next.length; i++) {
        next[i] = { ...next[i], state: 'leaving' };
      }

      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        setCircles((latest) => latest.filter((c) => c.state !== 'leaving'));
        fadeTimeoutRef.current = null;
      }, FADE_OUT_MS);

      return next;
    });
  }, [currentStep]);

  useEffect(() => {
    const hasEntering = circles.some((c) => c.state === 'entering');
    if (!hasEntering) return;

    const frame = requestAnimationFrame(() => {
      setCircles((prev) =>
        prev.map((c) => (c.state === 'entering' ? { ...c, state: 'visible' } : c))
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [circles]);

  const startGame = useCallback((op) => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);

    const q = generateTouchculatorQuestion(op);
    const initialStep = op === 'multiplication' ? 1 : 0;

    setSelectedOp(op);
    setQuestion(q);
    setCurrentStep(initialStep);
    setShowModal(false);
    setSubmitState(SubmitState.HIDDEN);
    setMultiplicationConfirmed(false);
    setCircles(getInitialCircles(q, op));
    isTappingRef.current = false;
  }, []);

  const handleTap = useCallback(() => {
    if (isTappingRef.current) return;
    if (!questionRef.current || !selectedOpRef.current) return;

    const q = questionRef.current;
    const op = selectedOpRef.current;
    const targetSteps = getTargetSteps(q, op);

    if (submitState === SubmitState.CONFIRMED) {
      setShowModal(true);
      return;
    }

    if (op === 'division' && currentStep === 1) {
      isTappingRef.current = true;
      setCurrentStep(2);
      setSubmitState(SubmitState.CONFIRMED);
      setShowModal(true);
      releaseTap();
      return;
    }

    if ((op === 'addition' || op === 'subtraction') && submitState === SubmitState.READY) {
      isTappingRef.current = true;
      setSubmitState(SubmitState.CONFIRMED);
      setShowModal(true);
      releaseTap();
      return;
    }

    if (submitState !== SubmitState.HIDDEN) return;

    if (op === 'multiplication' && currentStep === targetSteps - 1) {
      isTappingRef.current = true;
      const nextRow = currentStep;
      const lastGroup = Array.from({ length: q.a }, (_, i) => ({
        id: `circle-row${nextRow}-${i}-${Date.now()}`,
        state: 'visible',
        row: nextRow,
      }));
      setCircles((prev) => [...prev, ...lastGroup]);
      setMultiplicationConfirmed(true);
      setSubmitState(SubmitState.CONFIRMED);
      releaseTap();
      return;
    }

    if (currentStep >= targetSteps) return;

    isTappingRef.current = true;

    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next === targetSteps) {
        setSubmitState(op === 'division' ? SubmitState.CONFIRMED : SubmitState.READY);
      }
      return next;
    });

    if (op === 'multiplication') {
      const nextRow = currentStep;
      const newCircles = Array.from({ length: q.a }, (_, i) => ({
        id: `circle-row${nextRow}-${i}-${Date.now()}`,
        state: 'entering',
        row: nextRow,
      }));
      setCircles((prev) => [...prev, ...newCircles]);
    }

    releaseTap();
  }, [currentStep, releaseTap, submitState]);

  const handleReset = () => {
    setShowModal(false);
    if (selectedOp) startGame(selectedOp);
  };

  const handleBack = () => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    setSelectedOp(null);
    setQuestion(null);
    setCurrentStep(0);
    setShowModal(false);
    setSubmitState(SubmitState.HIDDEN);
    setMultiplicationConfirmed(false);
    setCircles([]);
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

  const targetSteps = question ? getTargetSteps(question, selectedOp) : 0;
  const targetVisible =
    (selectedOp === 'division' && currentStep >= 1) ||
    (selectedOp === 'multiplication' && multiplicationConfirmed);

  const hint = selectedOp === 'division'
    ? HINTS.division[currentStep] ?? HINTS.default
    : selectedOp === 'multiplication'
      ? (multiplicationConfirmed ? HINTS.multiplication.confirmed : HINTS.multiplication.adding)
      : submitState === SubmitState.READY
        ? HINTS.readyToSubmit
        : HINTS.default;

  return (
    <div className="page touchculator-game-page compact-page">
      <BackButton onClick={handleBack} />
      <div
        className="tc-game-shell"
        onClick={handleTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTap()}
      >
        <div className="tc-game transparent-game-surface">
          <div className="tc-question">
            <span className="tc-a">{question.a}</span>
            <span className="tc-op">{getOperationSymbol(selectedOp)}</span>
            <span className="tc-b">{question.b}</span>
            <span className="tc-eq">=</span>
            <span className={`tc-target${targetVisible ? ' tc-target-answer' : ''}`}>
              {targetVisible ? question.answer : '?'}
            </span>
          </div>

          <div
            className={`circles-area${selectedOp === 'multiplication' && multiplicationConfirmed ? ' multiplication-final' : ''}`}
            data-op={selectedOp}
            data-step={currentStep}
          >
            {selectedOp === 'division' ? (
              Array.from({ length: question.b }, (_, col) => (
                <div key={`col-${col}`} className="division-col">
                  {circles
                    .filter((c) => c.col === col)
                    .map((circle) => (
                      <div key={circle.id} className={`circle circle-${circle.state}`} />
                    ))}
                </div>
              ))
            ) : selectedOp === 'multiplication' ? (
              Array.from({ length: question.b }, (_, row) => (
                <div key={`row-${row}`} className="multiplication-row">
                  {circles
                    .filter((c) => c.row === row)
                    .map((circle) => (
                      <div key={circle.id} className={`circle circle-${circle.state}`} />
                    ))}
                </div>
              ))
            ) : (
              circles.map((circle) => (
                <div key={circle.id} className={`circle circle-${circle.state}`} />
              ))
            )}
          </div>

          <div className="tc-counter">
            <span className="tc-current">
              {selectedOp === 'multiplication' && multiplicationConfirmed
                ? `${targetSteps}/${targetSteps}`
                : `${currentStep}/${targetSteps}`}
            </span>
            <span className="tc-hint">{hint}</span>
          </div>

          <div className="tc-submit-zone">
            {submitState === SubmitState.READY || submitState === SubmitState.CONFIRMED ? (
              <div className="tc-checkmark">✓</div>
            ) : (
              <div className="tc-submit-placeholder" />
            )}
          </div>
        </div>
      </div>

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
