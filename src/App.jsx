import React from 'react';
import { useGame } from './context/GameContext';
import GameSetup from './components/GameSetup';
import GameBoard from './components/GameBoard';

function App() {
  const { gameState } = useGame();

  return (
    <div>
      {gameState.gameStage === 'setup' ? (
        <GameSetup />
      ) : (
        <GameBoard />
      )}
    </div>
  );
}

export default App;
