import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import './StartMenu.css';

const MODE_CARDS = [
  {
    path: '/modos/aprender-a-contar',
    emoji: '🔢',
    title: 'Aprender a Contar',
    desc: 'Conta até ao número que quiseres!',
    color: '#4facfe',
  },
  {
    path: '/modos/touchculator',
    emoji: '🧮',
    title: 'Touchculator',
    desc: 'Operaçőes visuais com toques!',
    color: '#f093fb',
  },
  {
    path: '/modos/historia',
    emoji: '🏰',
    title: 'Modo História',
    desc: 'Explora 4 reinos mágicos!',
    color: '#ffd700',
  },
  {
    path: '/modos/livre',
    emoji: '🎯',
    title: 'Modo Livre',
    desc: '10 perguntas à tua escolha!',
    color: '#7bed9f',
  },
];

export default function StartMenu() {
  const { state } = useGame();
  const navigate = useNavigate();
  const { player } = state;

  return (
    <div className="page start-menu-page">
      <div className="magic-bg">
        <div className="stars" />
      </div>

      <div className="player-info">
        <span className="player-avatar">{player.avatar}</span>
        <div className="player-details">
          <span className="player-name">{player.name}</span>
          <span className="player-title">🏅 {player.title}</span>
        </div>
      </div>

      <h1 className="menu-title">✨ A tua aventura começa! ✨</h1>

      <div className="mode-grid">
        {MODE_CARDS.map((mode) => (
          <button
            key={mode.path}
            className="mode-card"
            onClick={() => navigate(mode.path)}
            style={{ '--card-color': mode.color }}
          >
            <span className="mode-emoji">{mode.emoji}</span>
            <span className="mode-title">{mode.title}</span>
            <span className="mode-desc">{mode.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
