import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import styles from '../assets/styles/GameSetup.module.css';

const SEAT_POSITIONS = [
    { left: '50%', top: '92%' },   // 0: Bottom center
    { left: '20%', top: '82%' },   // 1: Bottom-left
    { left: '2%', top: '60%' },    // 2: Left-lower
    { left: '2%', top: '35%' },    // 3: Left-upper
    { left: '20%', top: '15%' },   // 4: Top-left
    { left: '50%', top: '8%' },    // 5: Top center
    { left: '80%', top: '15%' },   // 6: Top-right
    { left: '98%', top: '35%' },   // 7: Right-upper
    { left: '98%', top: '60%' },   // 8: Right-lower
    { left: '80%', top: '82%' },   // 9: Bottom-right
];

const GameSetup = () => {
    const { addPlayer, removePlayer, updateBlinds, startGame, gameState } = useGame();
    const [buyIn, setBuyIn] = useState('1000');
    const [sb, setSb] = useState(gameState.smallBlind);
    const [bb, setBb] = useState(gameState.bigBlind);
    const [addingSeatIndex, setAddingSeatIndex] = useState(null);
    const [newPlayerName, setNewPlayerName] = useState('');

    const handleAddPlayer = (seatIndex) => {
        setAddingSeatIndex(seatIndex);
        setNewPlayerName('');
    };

    const confirmAddPlayer = () => {
        if (newPlayerName.trim()) {
            addPlayer(newPlayerName.trim(), buyIn, addingSeatIndex);
            setNewPlayerName('');
            setAddingSeatIndex(null);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            confirmAddPlayer();
        } else if (e.key === 'Escape') {
            setAddingSeatIndex(null);
        }
    };

    const handleRemovePlayer = (playerId, e) => {
        e.stopPropagation();
        removePlayer(playerId);
    };

    const handleStartGame = () => {
        updateBlinds(Number(sb), Number(bb));
        startGame();
    };

    const playerCount = gameState.players.length;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.title}>New Game</h1>
                <p className={styles.subtitle}>{playerCount} player{playerCount !== 1 ? 's' : ''} seated</p>
            </header>

            {/* Config Row */}
            <section className={styles.configRow}>
                <div className={styles.configCard}>
                    <label className={styles.configLabel}>Buy-in</label>
                    <div className={styles.inputGroup}>
                        <span className={styles.inputPrefix}>$</span>
                        <input
                            type="number"
                            value={buyIn}
                            onChange={(e) => setBuyIn(e.target.value)}
                            className={styles.configInput}
                        />
                    </div>
                </div>
                <div className={styles.configCard}>
                    <label className={styles.configLabel}>Small Blind</label>
                    <div className={styles.inputGroup}>
                        <span className={styles.inputPrefix}>$</span>
                        <input
                            type="number"
                            value={sb}
                            onChange={(e) => setSb(e.target.value)}
                            className={styles.configInput}
                        />
                    </div>
                </div>
                <div className={styles.configCard}>
                    <label className={styles.configLabel}>Big Blind</label>
                    <div className={styles.inputGroup}>
                        <span className={styles.inputPrefix}>$</span>
                        <input
                            type="number"
                            value={bb}
                            onChange={(e) => setBb(e.target.value)}
                            className={styles.configInput}
                        />
                    </div>
                </div>
            </section>

            {/* Visual Table */}
            <section className={styles.tableSection}>
                <div className={styles.tableWrapper}>
                    <div className={styles.tableOval}>
                        <div className={styles.tableLabel}>Tap a seat to add a player</div>
                    </div>

                    {SEAT_POSITIONS.map((pos, index) => {
                        const player = gameState.players.find(p => p.seatIndex === index);

                        return (
                            <div
                                key={index}
                                className={styles.seatSlot}
                                style={{ left: pos.left, top: pos.top }}
                            >
                                {player ? (
                                    <button
                                        className={styles.playerPill}
                                        onClick={(e) => handleRemovePlayer(player.id, e)}
                                        title={`Remove ${player.name}`}
                                    >
                                        <span className={styles.playerInitial}>
                                            {player.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className={styles.playerName}>{player.name}</span>
                                        <span className={styles.removeX}>&times;</span>
                                    </button>
                                ) : addingSeatIndex === index ? (
                                    <div className={styles.addingWrap}>
                                        <input
                                            type="text"
                                            value={newPlayerName}
                                            onChange={(e) => setNewPlayerName(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            onBlur={() => {
                                                if (!newPlayerName.trim()) setAddingSeatIndex(null);
                                            }}
                                            placeholder="Name"
                                            className={styles.nameInput}
                                            autoFocus
                                        />
                                        <button
                                            className={styles.confirmBtn}
                                            onClick={confirmAddPlayer}
                                            disabled={!newPlayerName.trim()}
                                        >
                                            &#10003;
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className={styles.addSeatBtn}
                                        onClick={() => handleAddPlayer(index)}
                                    >
                                        <span className={styles.addIcon}>+</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Start Button */}
            <div className={styles.footer}>
                <button
                    className={styles.startButton}
                    onClick={handleStartGame}
                    disabled={playerCount < 2}
                >
                    Start Game
                </button>
            </div>
        </div>
    );
};

export default GameSetup;
