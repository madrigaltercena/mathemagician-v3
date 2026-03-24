import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import NumericKeypad from '../components/NumericKeypad';
import { numberToPortuguese } from '../utils/numberToPortuguese';
import './LearnToCount.css';

export default function LearnToCount() {
  const navigate = useNavigate();
  const [maxNumber, setMaxNumber] = useState('');
  const [started, setStarted] = useState(false);
  const [count, setCount] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [reward, setReward] = useState('');

  const REWARD_EMOJIS = ['🌟', '⭐', '🌙', '💫', '🎁', '🎀', '🏆', '🎯', '🔮', '🪄'];
  const parsedMax = parseInt(maxNumber, 10);
  const isValidMax = parsedMax >= 1 && parsedMax <= 1000;

  const handleStart = () => {
    if (isValidMax) {
      setStarted(true);
      setCount(1);
    }
  };

  const handleTap = () => {
    if (!isValidMax) return;
    if (count >= parsedMax) {
      setCount(parsedMax);
      setShowModal(true);
      return;
    }
    setCount((c) => c + 1);
  };

  const handleReward = () => {
    const emoji = REWARD_EMOJIS[Math.floor(Math.random() * REWARD_EMOJIS.length)];
    setReward(emoji);
    setShowModal(false);
    setTimeout(() => navigate('/menu'), 1200);
  };

  if (!started) {
    return (
      <div className="page count-landing-page compact-page">
        <BackButton onClick={() => navigate('/menu')} />
        <div className="count-landing compact-shell">
          <span className="count-landing-emoji">🔢</span>
          <h2>Aprender a Contar</h2>
          <p>Até que número queres contar?</p>
          <input
            className="count-input"
            type="text"
            inputMode="none"
            readOnly
            placeholder="1 - 1000"
            value={maxNumber}
            aria-label="Número máximo"
          />
          <NumericKeypad
            value={maxNumber}
            onChange={setMaxNumber}
            onSubmit={handleStart}
            canSubmit={isValidMax}
            maxLength={4}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page count-game-page compact-page">
      <BackButton onClick={() => { setStarted(false); setCount(1); }} />
      <button type="button" className="count-tap-zone" onClick={handleTap}>
        <div className="count-display">
          <span className="count-number">{count}</span>
          <span className="count-text">{numberToPortuguese(count)}</span>
          <span className="count-hint">Toque para +1</span>
        </div>
      </button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="🎉 Parabéns! 🎉">
        <p className="modal-text">
          Aprendeste a contar até <strong>{maxNumber}</strong>!
        </p>
        <p className="modal-text">Toque no botão para obter o teu prémio.</p>
        <button className="big-btn reward-btn" onClick={handleReward}>
          Obter prémio 🎁
        </button>
      </Modal>

      {reward && (
        <div className="reward-overlay">
          <span className="reward-emoji">{reward}</span>
          <p>Prémio conseguido!</p>
        </div>
      )}
    </div>
  );
}
