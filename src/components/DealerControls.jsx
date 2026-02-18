import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import styles from '../assets/styles/DealerControls.module.css';

const DealerControls = () => {
    const { gameState, nextStage, awardPot, resetGame, addPlayer, removePlayer } = useGame();
    const [isOpen, setIsOpen] = useState(false);
    const [showWinnerSelect, setShowWinnerSelect] = useState(false);
    const [showManagePlayers, setShowManagePlayers] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newBuyIn, setNewBuyIn] = useState('1000');


    const handleNextStage = () => {
        nextStage();
        setIsOpen(false);
    };

    const handleReset = () => {
        resetGame();
        setIsOpen(false);
    };

    const handleAwardPot = (playerId) => {
        awardPot(playerId);
        setShowWinnerSelect(false);
        setIsOpen(false);
    };

    const handleAddPlayer = () => {
        if (newPlayerName.trim()) {
            addPlayer(newPlayerName.trim(), newBuyIn);
            setNewPlayerName('');
        }
    };

    return (
        <>
            <button className={styles.toggleButton} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? 'Close' : 'Menu ≡'}
            </button>

            {isOpen && (
                <div className={styles.menu}>
                    <h3>Dealer Controls</h3>
                    <div className={styles.grid}>
                        <button onClick={handleNextStage} className={styles.actionBtn}>
                            Force Next Street ({gameState.gameStage})
                        </button>

                        <button onClick={() => setShowWinnerSelect(true)} className={styles.actionBtn}>
                            Award Pot
                        </button>

                        <button onClick={() => setShowManagePlayers(!showManagePlayers)} className={styles.actionBtn}>
                            {showManagePlayers ? 'Hide Players' : 'Manage Players'}
                        </button>

                        <button onClick={handleReset} className={`${styles.actionBtn} ${styles.danger}`}>
                            Reset Game
                        </button>
                    </div>

                    {/* Manage Players Panel */}
                    {showManagePlayers && (
                        <div className={styles.managePanel}>
                            <h4 style={{ margin: '8px 0', color: 'var(--text-secondary)' }}>Current Players</h4>
                            <div className={styles.playerList}>
                                {gameState.players.map(p => (
                                    <div key={p.id} className={styles.playerRow}>
                                        <span>{p.name} — ${p.chips}</span>
                                        {gameState.gameStage === 'setup' && (
                                            <button
                                                onClick={() => removePlayer(p.id)}
                                                className={styles.removeBtn}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {gameState.gameStage === 'setup' && (
                                <div className={styles.addRow}>
                                    <input
                                        type="text"
                                        value={newPlayerName}
                                        onChange={(e) => setNewPlayerName(e.target.value)}
                                        placeholder="Player name"
                                        className={styles.addInput}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                                    />
                                    <input
                                        type="number"
                                        value={newBuyIn}
                                        onChange={(e) => setNewBuyIn(e.target.value)}
                                        placeholder="Buy-in"
                                        className={styles.addInput}
                                        style={{ width: '80px' }}
                                    />
                                    <button onClick={handleAddPlayer} className={styles.addBtn} disabled={!newPlayerName.trim()}>
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showWinnerSelect && (
                <div className={styles.winnerModalOverlay}>
                    <div className={styles.winnerModal}>
                        <h3>Select Winner</h3>
                        <div className={styles.playerList}>
                            {gameState.players.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleAwardPot(p.id)}
                                    className={styles.playerBtn}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowWinnerSelect(false)} className={styles.cancelBtn}>Cancel</button>
                    </div>
                </div>
            )}
        </>
    );
};

export default DealerControls;
