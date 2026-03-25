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
      return question.a * step;
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
      return question.b;                   // b groups appear; last tap shows outlines, extra tap opens modal
    case 'division':
      return 2;                          // two taps: confirm groups, then submit
    default:
      return Math.ceil((question.a - question.answer) / question.b); // groups to remove
  }
}

/** Seed the initial visible circles matching the starting count (0 for add/mul, a for sub/div). */
function getInitialCircles(question, operation) {
  if (operation === 'division') {
    // b groups of `answer` circles each, organised in columns
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
    // One group of `a` circles shown from the start (step 1)
    // Additional groups are added by the sync effect on each tap
    return Array.from({ length: question.a }, (_, i) => ({
      id: `circle-${i}`,
      state: 'visible',
      row: 0,
    }));
  }
  const initialCount = operation === 'multiplication' ? 0 : question.a;
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
  const [confirmed, setConfirmed] = useState(false);       // multiplication: waiting for confirm tap
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
    // Guard: skip when step is 0 — initial circles are set directly in startGame
    if (currentStep === 0) return;
    // Division has a fixed 2-tap confirm flow — no circle transitions
    if (selectedOpRef.current === 'division') return;
    // Multiplication: when confirmed, outlines are shown but no circle transitions
    if (selectedOpRef.current === 'multiplication' && confirmed) return;

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
    // Addition/subtraction start at 0 (empty screen); multiplication starts at 1
    // (so first tap → a circles, not 2a). Guard in the sync effect prevents
    // the step-1 transition from running on mount for add/sub.
    const initialStep = op === 'multiplication' ? 1 : 0;
    setCurrentStep(initialStep);
    setShowModal(false);
    setReadyToSubmit(false);
    setConfirmed(false);
    setCircles(getInitialCircles(q, op));
    isTappingRef.current = false;
  }, []);

  // ── Handle tap ──────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (isTappingRef.current) return;
    if (!questionRef.current || !selectedOpRef.current) return;

    const q = questionRef.current;
    const op = selectedOpRef.current;
    const targetSteps = getTargetSteps(q, op);

    // Multiplication confirm tap: opens modal directly
    if (op === 'multiplication' && confirmed) {
      setShowModal(true);
      return;
    }

    // Multiplication: last group tap — show outlines + result; next tap opens modal
    // Fires when currentStep === targetSteps-1 (all b groups just became visible)
    if (op === 'multiplication' && currentStep === targetSteps - 1) {
      isTappingRef.current = true;
      // Add the last group of circles AND set confirmed atomically
      const lastGroup = Array.from({ length: q.a }, (_, i) => ({
        id: `circle-row${currentStep}-${i}-${Date.now()}`,
        state: 'visible',
        row: currentStep,
      }));
      setCircles((prev) => [...prev, ...lastGroup]);
      setConfirmed(true);
      setReadyToSubmit(true);
      setTimeout(() => { isTappingRef.current = false; }, 80);
      return;
    }

    // Division: second tap opens modal directly
    if (op === 'division' && currentStep === 1) {
      isTappingRef.current = true;
      setReadyToSubmit(true);
      setShowModal(true);
      setTimeout(() => { isTappingRef.current = false; }, 80);
      return;
    }

    // Guard: block taps past the target
    if (currentStep >= targetSteps) return;

    isTappingRef.current = true;

    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next === targetSteps) setReadyToSubmit(true);
      return next;
    });

    // Multiplication: add a new group of `a` circles directly
    if (op === 'multiplication') {
      const newCircles = Array.from({ length: q.a }, (_, i) => ({
        id: `circle-row${currentStep}-${i}-${Date.now()}`,
        state: 'entering',
        row: currentStep,
      }));
      setCircles((prev) => [...prev, ...newCircles]);
    }

    setTimeout(() => { isTappingRef.current = false; }, 80);
  }, [currentStep, readyToSubmit, confirmed]);

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
    setConfirmed(false);
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
            <span className={`tc-target${(selectedOp === 'division' && currentStep >= 1) || (selectedOp === 'multiplication' && confirmed) ? ' tc-target-answer' : ''}`}>
              {(selectedOp === 'division' && currentStep >= 1) || (selectedOp === 'multiplication' && confirmed) ? question.answer : '?'}
            </span>
          </div>

          <div
            className={`circles-area${selectedOp === 'multiplication' && confirmed ? ' multiplication-final' : ''}`}
            data-op={selectedOp}
            data-step={currentStep}
            style={{ '--answer': question.answer }}
          >
            {selectedOp === 'division' ? (
              // Group circles into columns for division display
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
              // Group circles into rows for multiplication display (grid: b rows × a cols)
              Array.from({ length: question.b }, (_, row) => (
                <div
                  key={`row-${row}`}
                  className={`multiplication-row${confirmed ? ' multiplication-row-final' : ''}`}
                >
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
            <span className="tc-current">{selectedOp === 'multiplication' && confirmed ? `${targetSteps}/${targetSteps}` : `${currentStep}/${targetSteps}`}</span>
            <span className="tc-hint">
              {selectedOp === 'division'
                ? currentStep === 0 ? 'Confirma as colunas' : 'Submeter resultado'
                : selectedOp === 'multiplication'
                ? confirmed ? 'Confirma o resultado' : 'Adiciona um grupo'
                : 'Toque em qualquer zona para avançar'}
            </span>
          </div>

          <div className="tc-submit-zone">
            {(selectedOp === 'division' || selectedOp === 'multiplication') && readyToSubmit ? (
              <div className="tc-checkmark">✓</div>
            ) : readyToSubmit ? (
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
