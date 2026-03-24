import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import { useGame } from '../contexts/GameContext';
import { generateFreeQuestion, getOperationLabel, getOperationSymbol } from '../utils/questionGenerator';
import './FreeMode.css';

const ALL_OPS = ['addition', 'subtraction', 'multiplication', 'division'];

export default function FreeMode() {
  const navigate = useNavigate();
  const { state, updateFreeMode } = useGame();
  const [selectedOps, setSelectedOps] = useState(
    state.freeMode.lastSelectedOperations.length > 0
      ? state.freeMode.lastSelectedOperations
      : ['addition']
  );
  const [phase, setPhase] = useState('landing'); // 'landing' | 'playing' | 'end'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const toggleOp = (op) => {
    if (selectedOps.includes(op)) {
      if (selectedOps.length === 1) return;
      setSelectedOps((ops) => ops.filter((o) => o !== op));
    } else {
      setSelectedOps((ops) => [...ops, op]);
    }
  };

  const startGame = () => {
    const qs = Array.from({ length: 10 }, () => generateFreeQuestion(selectedOps));
    setQuestions(qs);
    setCurrentIndex(0);
    setCorrectCount(0);
    setUserAnswer('');
    setFeedback(null);
    setPhase('playing');
    updateFreeMode({ lastSelectedOperations: selectedOps });
  };

  const currentQ = questions[currentIndex];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || !currentQ) return;

    const correct = parseInt(userAnswer, 10) === currentQ.answer;
    setFeedback(correct ? 'correct' : 'wrong');

    if (correct) {
      setCorrectCount((c) => c + 1);
      setTimeout(() => {
        if (currentIndex === 9) {
          setPhase('end');
          setShowModal(true);
        } else {
          setCurrentIndex((i) => i + 1);
          setUserAnswer('');
          setFeedback(null);
        }
      }, 600);
    } else {
      setTimeout(() => {
        setUserAnswer('');
        setFeedback(null);
      }, 800);
    }
  };

  const handleRepeat = () => {
    setShowModal(false);
    startGame();
  };

  const handleBack = () => {
    setShowModal(false);
    setPhase('landing');
    setQuestions([]);
    setCurrentIndex(0);
    setCorrectCount(0);
  };

  if (phase === 'landing') {
    return (
      <div className="page free-landing-page">
        <BackButton onClick={() => navigate('/menu')} />
        <div className="free-landing">
          <span className="free-emoji">🎯</span>
          <h2>Modo Livre</h2>
          <p>Escolhe as operações e completa 10 perguntas!</p>

          <div className="free-op-grid">
            {ALL_OPS.map((op) => (
              <button
                key={op}
                className={`free-op-btn ${selectedOps.includes(op) ? 'selected' : ''}`}
                onClick={() => toggleOp(op)}
              >
                <span className="free-op-symbol">{getOperationSymbol(op)}</span>
                <span className="free-op-label">{getOperationLabel(op)}</span>
              </button>
            ))}
          </div>

          <button className="big-btn" onClick={startGame}>
            Começar! 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page free-game-page">
      <BackButton onClick={() => { setPhase('landing'); }} />

      <div className="free-progress">
        <span className="free-progress-text">{currentIndex + 1}/10</span>
        <div className="free-progress-bar">
          <div
            className="free-progress-fill"
            style={{ width: `${((currentIndex) / 10) * 100}%` }}
          />
        </div>
      </div>

      <div className="question-card">
        <span className="q-number">Pergunta {currentIndex + 1}/10</span>
        <span className="q-text">{currentQ ? currentQ.text : '...'}</span>
      </div>

      <form className="answer-form" onSubmit={handleSubmit}>
        <input
          className={`answer-input ${feedback ? `feedback-${feedback}` : ''}`}
          type="number"
          placeholder="?"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          autoFocus
        />
        <button className="big-btn submit-btn" type="submit">
          Responder ✓
        </button>
      </form>

      {feedback === 'correct' && <span className="feedback-correct">✅ Correto!</span>}
      {feedback === 'wrong' && <span className="feedback-wrong">❌ Tenta novamente!</span>}

      <Modal
        open={showModal}
        onClose={handleBack}
        title="🎉 Terminaste! 🎉"
      >
        <div className="end-modal-content">
          <p className="score-big">{correctCount}/10</p>
          <p className="score-label">Respostas corretas!</p>
          <div className="modal-btns">
            <button className="big-btn" onClick={handleRepeat}>
              Repetir 🔄
            </button>
            <button className="big-btn" onClick={handleBack}>
              Voltar 📚
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
