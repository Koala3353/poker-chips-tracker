import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import Landing from './components/Landing';
import GameSetup from './components/GameSetup';
import GameBoard from './components/GameBoard';

function App() {
  const { gameState } = useGame();
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding && gameState.gameStage === 'setup') {
    return <Landing onStart={() => setShowLanding(false)} />;
  }

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
