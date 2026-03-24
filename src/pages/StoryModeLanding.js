import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import BackButton from '../components/BackButton';
import { KINGDOMS, MAGIC_ITEMS } from '../utils/gameData';
import './StoryModeLanding.css';

export default function StoryModeLanding() {
  const navigate = useNavigate();
  const { state } = useGame();
  const { storyMode } = state;

  const isKingdomUnlocked = (kingdomId) => kingdomId <= storyMode.unlockedKingdom;
  const isKingdomCompleted = (kingdomId) => storyMode.completedKingdoms.includes(kingdomId);
  const isItemUnlocked = (itemId) => storyMode.unlockedMagicItems.includes(itemId);

  const handleKingdomClick = (kingdom) => {
    if (isKingdomUnlocked(kingdom.id)) {
      navigate(`/modos/historia/${kingdom.id}`);
    }
  };

  return (
    <div className="page story-landing-page">
      <BackButton onClick={() => navigate('/menu')} />
      <h1 className="story-title">🏰 Modo História</h1>
      <p className="story-subtitle">Escolhe um reino para explorar!</p>

      <div className="kingdoms-grid">
        {KINGDOMS.map((kingdom) => {
          const unlocked = isKingdomUnlocked(kingdom.id);
          const completed = isKingdomCompleted(kingdom.id);
          return (
            <button
              key={kingdom.id}
              className={`kingdom-card ${!unlocked ? 'locked' : ''} ${completed ? 'completed' : ''}`}
              onClick={() => handleKingdomClick(kingdom)}
              disabled={!unlocked}
            >
              <span className="kingdom-emoji">{kingdom.emoji}</span>
              {completed && <span className="kingdom-check">✅</span>}
              {!unlocked && <span className="kingdom-lock">🔒</span>}
              <span className="kingdom-name">{kingdom.name}</span>
              <span className="kingdom-desc">{kingdom.description}</span>
            </button>
          );
        })}
      </div>

      <div className="magic-items-section">
        <h2 className="items-title">🪄 Itens Mágicos</h2>
        <div className="items-grid">
          {MAGIC_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`magic-item ${isItemUnlocked(item.id) ? 'unlocked' : 'locked-item'}`}
            >
              <span className="item-emoji">{isItemUnlocked(item.id) ? item.emoji : '❓'}</span>
              <span className="item-name">{isItemUnlocked(item.id) ? item.name : '???'}</span>
              <span className="item-level">Nível {item.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
