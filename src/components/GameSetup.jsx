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
    const [layouts, setLayouts] = useState(() => {
        const saved = localStorage.getItem('poker-tracker-layouts');
        return saved ? JSON.parse(saved) : [];
    });
    const [showLayouts, setShowLayouts] = useState(false);
    const [layoutName, setLayoutName] = useState('');

    const saveLayout = () => {
        if (!layoutName.trim() || gameState.players.length === 0) return;
        const newLayout = {
            name: layoutName.trim(),
            players: gameState.players.map(p => ({ name: p.name, seatIndex: p.seatIndex }))
        };
        const newLayouts = [...layouts, newLayout];
        setLayouts(newLayouts);
        localStorage.setItem('poker-tracker-layouts', JSON.stringify(newLayouts));
        setLayoutName('');
    };

    const deleteLayout = (index) => {
        const newLayouts = layouts.filter((_, i) => i !== index);
        setLayouts(newLayouts);
        localStorage.setItem('poker-tracker-layouts', JSON.stringify(newLayouts));
    };

    const loadLayout = (layout) => {
        // Clear current players
        gameState.players.forEach(p => removePlayer(p.id));

        // Add new players
        // We use a small timeout or just relying on state batching. 
        // Since removePlayer is async state update, simply calling addPlayer immediately after 
        // in the same loop might result in mixed state if not careful, but functional updates in reducer usually handle this.
        // However, standard React batching should make this work.

        // To be safe against state race conditions, we can't easily rely on removePlayer then addPlayer 
        // if they depend on "current" state length for IDs or something. 
        // But addPlayer just appends. removePlayer filters.

        // Let's try just iterating.
        layout.players.forEach(p => {
            addPlayer(p.name, buyIn, p.seatIndex);
        });

        setShowLayouts(false);
    };

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
        // updateBlinds(Number(sb), Number(bb)); // Not strictly needed if startGame handles it, but good for redundancy?
        // Note: startGame now handles setting the state too, so we can just call:
        startGame(Number(sb), Number(bb));
    };

    const playerCount = gameState.players.length;

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <h1 className={styles.title}>New Game</h1>
                    <button
                        className={styles.addSeatBtn}
                        style={{ width: 'auto', padding: '4px 12px', fontSize: '12px', borderRadius: '12px', height: '24px' }}
                        onClick={() => setShowLayouts(!showLayouts)}
                    >
                        {showLayouts ? 'Close Presets' : 'Presets'}
                    </button>
                </div>
                <p className={styles.subtitle}>{playerCount} player{playerCount !== 1 ? 's' : ''} seated</p>

                {showLayouts && (
                    <div className={styles.configCard} style={{ margin: '10px auto', maxWidth: '400px', width: '90%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    placeholder="Layout Name"
                                    value={layoutName}
                                    onChange={(e) => setLayoutName(e.target.value)}
                                    className={styles.nameInput}
                                    style={{ flex: 1 }}
                                />
                                <button onClick={saveLayout} className={styles.confirmBtn} disabled={!layoutName.trim() || playerCount === 0}>Save</button>
                            </div>

                            {layouts.length > 0 && (
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                                    <h4 style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Saved Layouts</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                                        {layouts.map((l, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                                <span style={{ fontSize: '13px' }}>{l.name} ({l.players.length})</span>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => loadLayout(l)}
                                                        style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '4px', padding: '2px 8px', color: '#000', fontSize: '11px', cursor: 'pointer' }}
                                                    >
                                                        Load
                                                    </button>
                                                    <button
                                                        onClick={() => deleteLayout(i)}
                                                        style={{ background: 'rgba(255,59,48,0.2)', border: 'none', borderRadius: '4px', padding: '2px 8px', color: '#ff3b30', fontSize: '11px', cursor: 'pointer' }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
