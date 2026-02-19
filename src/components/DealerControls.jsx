import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import styles from '../assets/styles/DealerControls.module.css';

const DealerControls = () => {
    const { gameState, nextStage, awardPot, resetGame, addPlayer, removePlayer, updatePlayerChips } = useGame();
    const [isOpen, setIsOpen] = useState(false);
    const [showWinnerSelect, setShowWinnerSelect] = useState(false);
    const [selectedWinners, setSelectedWinners] = useState([]);
    const [showManagePlayers, setShowManagePlayers] = useState(false);
    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [editChipsAmount, setEditChipsAmount] = useState('');
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

    const handleAwardPot = () => {
        if (selectedWinners.length > 0) {
            awardPot(selectedWinners);
            setShowWinnerSelect(false);
            setSelectedWinners([]);
            setIsOpen(false);
        }
    };

    const toggleWinnerSelection = (id) => {
        setSelectedWinners(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
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
                                        {editingPlayerId === p.id ? (
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                                                <span>{p.name}</span>
                                                <input
                                                    type="number"
                                                    value={editChipsAmount}
                                                    onChange={(e) => setEditChipsAmount(e.target.value)}
                                                    className={styles.addInput}
                                                    style={{ width: '80px', padding: '4px' }}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => {
                                                        updatePlayerChips(p.id, editChipsAmount);
                                                        setEditingPlayerId(null);
                                                    }}
                                                    className={styles.addBtn}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        ) : (
                                            <span onClick={() => {
                                                setEditingPlayerId(p.id);
                                                setEditChipsAmount(p.chips);
                                            }} style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}>
                                                {p.name} — ${p.chips}
                                            </span>
                                        )}

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
                        <h3>Select Winner(s)</h3>
                        <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
                            Select multiple players for a split pot.
                        </p>
                        <div className={styles.playerList}>
                            {gameState.players.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => toggleWinnerSelection(p.id)}
                                    className={`${styles.playerBtn} ${selectedWinners.includes(p.id) ? styles.selected : ''}`}
                                    style={selectedWinners.includes(p.id) ? {
                                        backgroundColor: 'var(--primary-color)',
                                        color: '#000',
                                        borderColor: 'var(--primary-color)'
                                    } : {}}
                                >
                                    {p.name}
                                    {selectedWinners.includes(p.id) && ' ✓'}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button onClick={() => setShowWinnerSelect(false)} className={styles.cancelBtn}>Cancel</button>
                            <button
                                onClick={handleAwardPot}
                                className={styles.actionBtn}
                                disabled={selectedWinners.length === 0}
                                style={{ flex: 1, background: 'var(--primary-color)', color: '#000' }}
                            >
                                Confirm Winner{selectedWinners.length > 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default DealerControls;
