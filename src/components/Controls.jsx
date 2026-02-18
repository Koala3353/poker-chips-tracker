import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import styles from '../assets/styles/Controls.module.css';

const Controls = () => {
    const { gameState, placeBet, goAllIn, fold, check, nextHand } = useGame();
    const [raiseAmount, setRaiseAmount] = useState('');

    const activePlayer = gameState.players[gameState.activePlayerIndex];

    // Amount needed to match the current highest bet
    const toCall = gameState.currentBet - activePlayer.currentBet;
    const canCheck = toCall === 0;
    const playerChips = activePlayer.chips;

    // Can the player afford the full call?
    const canAffordCall = playerChips >= toCall;
    // Effective call amount (capped at chips)
    const effectiveCall = Math.min(toCall, playerChips);

    // Min raise: must put in at least toCall + bigBlind from stack
    const minRaise = gameState.bigBlind;
    const minRaiseTotal = toCall + minRaise;
    const canAffordRaise = playerChips >= minRaiseTotal;

    const handleFold = () => fold();
    const handleCheck = () => check();

    const handleCall = () => {
        if (canAffordCall) {
            placeBet(toCall);
        } else {
            // Call for all chips (partial call = all-in)
            goAllIn();
        }
    };

    const handleRaise = () => {
        const amount = parseFloat(raiseAmount);
        if (!amount || isNaN(amount)) return;
        // Cap at player's chips
        const capped = Math.min(amount, playerChips);
        placeBet(capped);
        setRaiseAmount('');
    };

    const handleAllIn = () => {
        goAllIn();
    };

    // Show showdown UI
    if (gameState.gameStage === 'showdown') {
        return (
            <div className={styles.container}>
                <div className={styles.infoBar}>
                    <div className={styles.potDisplay}>
                        <span className={styles.label}>Total Pot</span>
                        <span className={styles.value}>${gameState.pot}</span>
                    </div>
                </div>
                <div className={styles.showdown}>
                    {gameState.pot === 0 ? (
                        <button className={styles.nextHandBtn} onClick={nextHand}>
                            Start Next Hand
                        </button>
                    ) : (
                        <div className={styles.instruction}>Tap a player to award the pot</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.infoBar}>
                <div className={styles.potDisplay}>
                    <span className={styles.label}>Total Pot</span>
                    <span className={styles.value}>${gameState.pot}</span>
                </div>
                <div className={styles.betInfo}>
                    {toCall > 0 && <span className={styles.toCall}>To Call: <strong>${toCall}</strong></span>}
                </div>
            </div>

            <div className={styles.actions}>
                {/* Fold */}
                <button
                    className={`${styles.btn} ${styles.fold}`}
                    onClick={handleFold}
                    disabled={gameState.isTransitioning}
                >
                    Fold
                </button>

                {/* Check / Call */}
                {canCheck ? (
                    <button
                        className={`${styles.btn} ${styles.check}`}
                        onClick={handleCheck}
                        disabled={gameState.isTransitioning}
                    >
                        Check
                    </button>
                ) : canAffordCall ? (
                    <button
                        className={`${styles.btn} ${styles.call}`}
                        onClick={handleCall}
                        disabled={gameState.isTransitioning}
                    >
                        Call ${toCall}
                    </button>
                ) : (
                    <button
                        className={`${styles.btn} ${styles.allIn}`}
                        onClick={handleAllIn}
                        disabled={gameState.isTransitioning}
                    >
                        All In ${playerChips}
                    </button>
                )}

                {/* Raise Group or All-In */}
                {canAffordRaise ? (
                    <div className={styles.raiseGroup}>
                        <button
                            className={`${styles.btn} ${styles.raise}`}
                            onClick={handleRaise}
                            disabled={!raiseAmount || parseFloat(raiseAmount) < minRaiseTotal || parseFloat(raiseAmount) > playerChips || gameState.isTransitioning}
                        >
                            Raise
                        </button>
                        <input
                            type="number"
                            value={raiseAmount}
                            onChange={(e) => setRaiseAmount(e.target.value)}
                            placeholder={`Min ${minRaiseTotal}`}
                            className={styles.input}
                            max={playerChips}
                            disabled={gameState.isTransitioning}
                        />
                    </div>
                ) : (
                    !canCheck && canAffordCall && (
                        <div className={styles.raiseGroup}>
                            <button
                                className={`${styles.btn} ${styles.allIn}`}
                                onClick={handleAllIn}
                                disabled={gameState.isTransitioning}
                            >
                                All In ${playerChips}
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default Controls;
