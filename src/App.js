import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './contexts/GameContext';
import PlayerCreation from './pages/PlayerCreation';
import StartMenu from './pages/StartMenu';
import LearnToCount from './pages/LearnToCount';
import Touchculator from './pages/Touchculator';
import StoryModeLanding from './pages/StoryModeLanding';
import StoryModeGame from './pages/StoryModeGame';
import FreeMode from './pages/FreeMode';
import './index.css';

function AppRoutes() {
  const { state, isLoaded } = useGame();

  if (!isLoaded) {
    return <div className="loading-screen">✨ A carregar...</div>;
  }

  const hasPlayer = state.player.name && state.player.avatar;

  return (
    <Routes>
      <Route path="/" element={hasPlayer ? <Navigate to="/menu" /> : <PlayerCreation />} />
      <Route path="/menu" element={hasPlayer ? <StartMenu /> : <Navigate to="/" />} />
      <Route path="/modos/aprender-a-contar" element={<LearnToCount />} />
      <Route path="/modos/touchculator" element={<Touchculator />} />
      <Route path="/modos/historia" element={<StoryModeLanding />} />
      <Route path="/modos/historia/:kingdomId" element={<StoryModeGame />} />
      <Route path="/modos/livre" element={<FreeMode />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <AppRoutes />
      </GameProvider>
    </BrowserRouter>
  );
}

export default App;
