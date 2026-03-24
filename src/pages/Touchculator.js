import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import { generateTouchculatorQuestion, getOperationSymbol, getOperationLabel } from '../utils/questionGenerator';
import './Touchculator.css';

const OPERATIONS = ['addition', 'subtraction', 'multiplication', 'division'];
const FADE_OUT_MS = 220;

/**
 * Visual count at a given step for each operation.
 * Addition:       circles build up from 0 to a+b
 * Subtraction:    circles decrease from a to a-b
 * Multiplication: circles build groups — each step adds `a` circles
 * Division:       circles decrease by `b` each tap, stopping at the answer
 */
function getVisualCount(question, operation, step) {
  switch (operation) {
    case 'addition':
      // 0 taps → 0 circles, 1 tap → a+1 circles, ..., b taps → a+b circles
      return question.a + step;
    case 'subtraction':
      // Each tap removes 1 from the visible count, floor at answer
      return Math.max(question.a - step, question.answer);
    case 'multiplication':
      // Each tap adds one full group of `a` circles
      return question.a * (step + 1);
    case 'division':
      // Each tap removes `b` circles, stopping at the quotient (answer)
      return Math.max(question.a - question.b * step, question.answer);
    default:
      return question.a + step;
  }
}

/** Total taps needed to reach the target. */
function getTargetSteps(question, operation) {
  switch (operation) {
    case 'addition':
      return question.b;                          // b taps to add b items
    case 'subtraction':
      return question.a - question.answer;          // (a - answer) taps to subtract
    case 'multiplication':
      return question.b;                           // b groups of `a`
    case 'division':
      return Math.ceil((question.a - question.answer) / question.b); // groups to remove
    default:
      return question.b;
  }
}

/** Seed the initial visible circles matching the starting count (0 for add/mul, a for sub/div). */
function getInitialCircles(question, operation) {
  const initialCount =
    operation === 'addition' || operation === 'multiplication' ? 0 : question.a;
  return Array.from({ length: initialCount }, (_, i) => ({
    id: `circle-${i}`,
    state: 'visible',
  }));
}

/** How many circles to add or remove to go from current to next. Positive = add, negative = remove. */
function circleDelta(currentCount, nextCount) {
  return nextCount - currentCount;
}

export default function Touchculator() {
  const navigate = useNavigate();
  const [selectedOp, setSelectedOp] = useState(null);
  const [question, setQuestion] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [circles, setCircles] = useState([]);

  // Stable refs — no re-render triggers
  const questionRef = useRef(null);
  const selectedOpRef = useRef(null);
  const isTappingRef = useRef(false);           // prevents double-tap
  const fadeTimeoutRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => { selectedOpRef.current = selectedOp; }, [selectedOp]);

  // ── Cleanup fade timeout on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  // ── Sync circle count whenever step changes ──────────────────────────────
  useEffect(() => {
    if (!questionRef.current || !selectedOpRef.current) return;

    const q = questionRef.current;
    const op = selectedOpRef.current;
    const nextCount = getVisualCount(q, op, currentStep);

    setCircles((prev) => {
      const visible = prev.filter((c) => c.state !== 'leaving');
      const currentCount = visible.length;
      const delta = circleDelta(currentCount, nextCount);

      if (delta === 0) return prev;

      if (delta > 0) {
        // Adding circles — append new ones at the end
        const additions = Array.from({ length: delta }, (_, i) => ({
          id: `circle-${currentCount + i}-${Date.now()}`,
          state: 'entering',
        }));
        return [...visible, ...additions];
      }

      // Removing circles — take from the **beginning** (oldest/leftmost)
      // so the visual order matches the "grouping" metaphor for division
      const removeCount = Math.abs(delta);
      const next = [...visible];
      for (let i = 0; i < removeCount && i < next.length; i++) {
        next[i] = { ...next[i], state: 'leaving' };
      }

      // Schedule the actual removal after fade-out — outside this updater
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        setCircles((latest) => latest.filter((c) => c.state !== 'leaving'));
        fadeTimeoutRef.current = null;
      }, FADE_OUT_MS);

      return next;
    });
  }, [currentStep]);

  // ── Transition entering circles to visible after paint ───────────────────
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

  // ── Start a new game ─────────────────────────────────────────────────────
  const startGame = useCallback((op) => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    const q = generateTouchculatorQuestion(op);
    setSelectedOp(op);           // state for render
    setQuestion(q);
    setCurrentStep(0);
    setShowModal(false);
    setReadyToSubmit(false);
    setCircles(getInitialCircles(q, op));
    isTappingRef.current = false;
  }, []);

  // ── Handle tap ──────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (isTappingRef.current) return;           // tap lock
    const q = questionRef.current;
    const op = selectedOpRef.current;
    if (!q || readyToSubmit) return;

    const targetSteps = getTargetSteps(q, op);
    if (currentStep >= targetSteps) return;

    isTappingRef.current = true;
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next === targetSteps) setReadyToSubmit(true);
      return next;
    });

    // Release lock after a short debounce so rapid taps don't double-fire
    setTimeout(() => { isTappingRef.current = false; }, 80);
  }, [currentStep, readyToSubmit]);

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
    setReadyToSubmit(false);
    setCircles([]);
  };

  // ── Landing screen ──────────────────────────────────────────────────────
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
            <span className="tc-target">?</span>
          </div>

          <div className="circles-area">
            {circles.map((circle) => (
              <div key={circle.id} className={`circle circle-${circle.state}`} />
            ))}
          </div>

          <div className="tc-counter">
            <span className="tc-current">{currentStep}/{targetSteps}</span>
            <span className="tc-hint">Toque em qualquer zona para avançar</span>
          </div>

          <div className="tc-submit-zone">
            {readyToSubmit ? (
              <>
                <div className="tc-checkmark">✓</div>
                <button
                  type="button"
                  className="big-btn tc-submit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModal(true);
                  }}
                >
                  Submeter
                </button>
              </>
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
