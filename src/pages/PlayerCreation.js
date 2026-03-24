import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { AVATARS } from '../utils/gameData';
import './PlayerCreation.css';

export default function PlayerCreation() {
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [name, setName] = useState('');
  const { updatePlayer } = useGame();
  const navigate = useNavigate();

  const prev = () => setSelectedAvatar((i) => (i - 1 + AVATARS.length) % AVATARS.length);
  const next = () => setSelectedAvatar((i) => (i + 1) % AVATARS.length);

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updatePlayer({ name: trimmed, avatar: AVATARS[selectedAvatar], title: 'Aprendiz' });
    navigate('/menu');
  };

  return (
    <div className="page player-creation-page">
      <div className="magic-bg">
        <div className="stars" />
      </div>
      <h1 className="game-title">✨ Mathemagician ✨</h1>
      <p className="subtitle">Cria o teu personagem mágico!</p>

      <div className="avatar-carousel">
        <button className="carousel-btn" onClick={prev}>❮</button>
        <div className="avatar-display">
          <span className="avatar-emoji" key={selectedAvatar}>{AVATARS[selectedAvatar]}</span>
        </div>
        <button className="carousel-btn" onClick={next}>❯</button>
      </div>

      <div className="avatar-dots">
        {AVATARS.map((_, i) => (
          <span key={i} className={`dot ${i === selectedAvatar ? 'active' : ''}`} />
        ))}
      </div>

      <input
        className="name-input"
        type="text"
        placeholder="Escreve o teu nome..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
      />

      <button
        className="big-btn start-btn"
        onClick={handleStart}
        disabled={!name.trim()}
      >
        Começar a aventura! 🚀
      </button>
    </div>
  );
}
