import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';
import { useGame } from '../contexts/GameContext';
import { KINGDOMS, MAGIC_ITEMS } from '../utils/gameData';
import { generateQuestion } from '../utils/questionGenerator';
import './StoryModeGame.css';

export default function StoryModeGame() {
  const { kingdomId } = useParams();
  const navigate = useNavigate();
  const { state, updateStoryMode } = useGame();
  const { storyMode } = state;

  const kId = parseInt(kingdomId, 10);
  const kingdom = KINGDOMS[kId - 1];
  const isReplay = storyMode.completedKingdoms.includes(kId);

  const savedLevel = storyMode.currentKingdom === kId ? storyMode.currentLevel : 1;
  const savedQuestion = storyMode.currentKingdom === kId ? storyMode.currentQuestion : 1;

  const [currentLevel, setCurrentLevel] = useState(isReplay ? 1 : savedLevel);
  const [currentQuestion, setCurrentQuestion] = useState(isReplay ? 1 : savedQuestion);
  const [question, setQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState(null); // { type: 'simple'|'big'|'end', data: {} }
  const [feedback, setFeedback] = useState(null);

  const globalLevel = (kId - 1) * 4 + currentLevel;
  const isLastLevel = currentLevel === 4;
  const isLastQuestion = currentQuestion === 5;

  const hasNewItem = MAGIC_ITEMS.some((item) => item.level === globalLevel);

  useEffect(() => {
    const q = generateQuestion(kId, currentLevel);
    setQuestion(q);
    setUserAnswer('');
    setFeedback(null);
  }, [kId, currentLevel, currentQuestion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || !question) return;

    const correct = parseInt(userAnswer, 10) === question.answer;
    setFeedback(correct ? 'correct' : 'wrong');

    if (correct) {
      setTimeout(() => {
        if (isLastQuestion) {
          // All 5 questions done
          if (isLastLevel) {
            // Kingdom complete!
            const item = hasNewItem ? MAGIC_ITEMS.find((i) => i.level === globalLevel) : null;
            const newUnlocked = item
              ? [...storyMode.unlockedMagicItems, item.id]
              : storyMode.unlockedMagicItems;
            const nextKingdomId = kId + 1;
            const newCompletedKingdoms = isReplay
              ? storyMode.completedKingdoms
              : [...storyMode.completedKingdoms, kId];

            updateStoryMode({
              completedKingdoms: newCompletedKingdoms,
              unlockedMagicItems: newUnlocked,
              unlockedKingdom: Math.max(storyMode.unlockedKingdom, nextKingdomId),
              currentKingdom: 1,
              currentLevel: 1,
              currentQuestion: 1,
            });

            setModalConfig({ type: 'big', item });
            setShowModal(true);
          } else {
            // Level done, advance
            const nextLevel = currentLevel + 1;
            const nextGlobal = (kId - 1) * 4 + nextLevel;
            const item = MAGIC_ITEMS.find((i) => i.level === globalLevel);
            const newUnlocked = item
              ? [...storyMode.unlockedMagicItems, item.id]
              : storyMode.unlockedMagicItems;

            updateStoryMode({
              currentLevel: nextLevel,
              currentQuestion: 1,
              unlockedMagicItems: newUnlocked,
              highestLevelUnlocked: Math.max(storyMode.highestLevelUnlocked, nextGlobal),
            });

            setModalConfig({ type: 'simple', item, level: currentLevel });
            setShowModal(true);
          }
        } else {
          // Next question
          const nextQ = currentQuestion + 1;
          setCurrentQuestion(nextQ);
          updateStoryMode({
            currentKingdom: kId,
            currentLevel,
            currentQuestion: nextQ,
          });
        }
        setFeedback(null);
      }, 600);
    } else {
      setTimeout(() => {
        setUserAnswer('');
        setFeedback(null);
      }, 800);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (modalConfig?.type === 'big') {
      navigate('/modos/historia');
    } else {
      // Go to next level
      if (!isLastLevel) {
        setCurrentLevel((l) => l + 1);
        setCurrentQuestion(1);
      } else {
        navigate('/modos/historia');
      }
    }
  };

  if (!kingdom) {
    return (
      <div className="page">
        <BackButton onClick={() => navigate('/modos/historia')} />
        <p>Reino não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page story-game-page">
      <BackButton onClick={() => navigate('/modos/historia')} />

      <div className="story-game-header">
        <span className="sg-kingdom">{kingdom.emoji} {kingdom.name}</span>
        <span className="sg-level">Nível {currentLevel}/4</span>
      </div>

      <div className="question-progress">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`q-dot ${n < currentQuestion ? 'done' : ''} ${n === currentQuestion ? 'current' : ''}`}
          />
        ))}
      </div>

      <div className="question-card">
        <span className="q-number">Pergunta {currentQuestion}/5</span>
        <span className="q-text">{question ? question.text : '...'}</span>
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
        onClose={handleModalClose}
        title="🎉 Parabéns! 🎉"
        size={modalConfig?.type === 'big' ? 'large' : 'normal'}
      >
        {modalConfig?.type === 'big' ? (
          <div className="big-modal-content">
            <p>Completaste o reino <strong>{kingdom.name}</strong>!</p>
            {modalConfig.item && (
              <div className="item-unlock">
                <span className="item-unlock-emoji">{modalConfig.item.emoji}</span>
                <p>Desbloqueaste: <strong>{modalConfig.item.name}</strong></p>
              </div>
            )}
            <button className="big-btn" onClick={handleModalClose}>Continuar ➡️</button>
          </div>
        ) : (
          <div className="simple-modal-content">
            <p>Completaste o nível <strong>{currentLevel}</strong>!</p>
            {modalConfig?.item && (
              <div className="item-unlock-sm">
                <span>{modalConfig.item.emoji}</span>
                <span> Novo item: {modalConfig.item.name}!</span>
              </div>
            )}
            <button className="big-btn" onClick={handleModalClose}>Próximo Nível ➡️</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
