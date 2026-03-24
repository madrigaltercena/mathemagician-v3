import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

const STORAGE_KEY = 'mathemagician_save';

const defaultState = {
  player: {
    name: '',
    avatar: '',
    title: 'Aprendiz',
  },
  storyMode: {
    unlockedKingdom: 1,
    highestLevelUnlocked: 1,
    currentKingdom: 1,
    currentLevel: 1,
    currentQuestion: 1,
    completedLevels: [],
    completedKingdoms: [],
    unlockedMagicItems: [],
  },
  freeMode: {
    lastSelectedOperations: [],
  },
};

export function GameProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({ ...defaultState, ...parsed });
      } catch {
        setState(defaultState);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const updatePlayer = (playerData) =>
    setState((s) => ({ ...s, player: { ...s.player, ...playerData } }));

  const updateStoryMode = (storyData) =>
    setState((s) => ({
      ...s,
      storyMode: { ...s.storyMode, ...storyData },
    }));

  const updateFreeMode = (freeData) =>
    setState((s) => ({
      ...s,
      freeMode: { ...s.freeMode, ...freeData },
    }));

  const resetProgress = () => {
    setState((s) => ({
      ...s,
      storyMode: { ...defaultState.storyMode },
      freeMode: { ...defaultState.freeMode },
    }));
  };

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
  };

  return (
    <GameContext.Provider
      value={{ state, isLoaded, updatePlayer, updateStoryMode, updateFreeMode, resetProgress, resetAll }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
