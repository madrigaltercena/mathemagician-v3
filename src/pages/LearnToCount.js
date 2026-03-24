import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
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

  const handleStart = () => {
    const n = parseInt(maxNumber, 10);
    if (n >= 1 && n <= 1000) {
      setStarted(true);
      setCount(1);
    }
  };

  const handleTap = () => {
    if (count >= parseInt(maxNumber, 10)) {
      setCount(parseInt(maxNumber, 10));
      setShowModal(true);
    } else {
      setCount((c) => c + 1);
    }
  };

  const handleReward = () => {
    const emoji = REWARD_EMOJIS[Math.floor(Math.random() * REWARD_EMOJIS.length)];
    setReward(emoji);
    setShowModal(false);
    setTimeout(() => navigate('/menu'), 1500);
  };

  if (!started) {
    return (
      <div className="page count-landing-page">
        <BackButton onClick={() => navigate('/menu')} />
        <div className="count-landing">
          <span className="count-landing-emoji">🔢</span>
          <h2>Aprender a Contar</h2>
          <p>Ate que número queres contar?</p>
          <input
            className="count-input"
            type="number"
            min="1"
            max="1000"
            placeholder="1 - 1000"
            value={maxNumber}
            onChange={(e) => setMaxNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
          <button
            className="big-btn"
            onClick={handleStart}
            disabled={!maxNumber || parseInt(maxNumber) < 1 || parseInt(maxNumber) > 1000}
          >
            Começar! 🎯
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page count-game-page" onClick={handleTap}>
      <BackButton onClick={() => { setStarted(false); setCount(1); }} />
      <div className="count-display">
        <span className="count-number">{count}</span>
        <span className="count-text">{numberToPortuguese(count)}</span>
        <span className="count-hint">Toque para +1</span>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="🎉 Parabéns! 🎉">
        <p className="modal-text">
          Aprendeste a contar até <strong>{maxNumber}</strong>!
        </p>
        <p className="modal-text">Toque no botão para obter o teu prémio!</p>
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
