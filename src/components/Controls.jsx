import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context/GameContext';
import styles from '../assets/styles/Controls.module.css';

const LAST_RAISE_KEY = 'poker-tracker-last-raise';
const BET_STEP_KEY = 'poker-tracker-bet-step';

const getStoredNumber = (key) => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(key);
    const parsed = parseFloat(saved);
    return Number.isFinite(parsed) ? parsed : null;
};

const Controls = () => {
    const { gameState, placeBet, goAllIn, fold, check, nextHand, resetGame } = useGame();
    const [raiseAmount, setRaiseAmount] = useState('');
    const [lastRaiseAmount, setLastRaiseAmount] = useState(() => getStoredNumber(LAST_RAISE_KEY));
    const [betStep, setBetStep] = useState(() => getStoredNumber(BET_STEP_KEY) || gameState.bigBlind);

    const activePlayer = gameState.players[gameState.activePlayerIndex];

    // Amount needed to match the current highest bet
    const toCall = gameState.currentBet - activePlayer.currentBet;
    const canCheck = toCall === 0;
    const playerChips = activePlayer.chips;

    // Can the player afford the full call?
    const canAffordCall = playerChips >= toCall;
    // Effective call amount (capped at chips)
    // const effectiveCall = Math.min(toCall, playerChips); // Unused

    // Min raise: must put in at least toCall + bigBlind from stack
    const minRaise = gameState.bigBlind;
    const minRaiseTotal = toCall + minRaise;
    const canAffordRaise = playerChips >= minRaiseTotal;

    const clampRaise = React.useCallback((value, alignToStep = true) => {
        let amount = value;
        if (alignToStep && betStep) {
            amount = Math.round(amount / betStep) * betStep;
        }
        return Math.max(minRaiseTotal, Math.min(amount, playerChips));
    }, [betStep, minRaiseTotal, playerChips]);

    const defaultRaiseAmount = React.useMemo(() => {
        if (!canAffordRaise) return null;
        const candidate = lastRaiseAmount && lastRaiseAmount >= minRaiseTotal ? lastRaiseAmount : minRaiseTotal;
        return clampRaise(candidate, false);
    }, [canAffordRaise, lastRaiseAmount, minRaiseTotal, clampRaise]);

    React.useEffect(() => {
        if (defaultRaiseAmount === null) {
            setRaiseAmount('');
            return;
        }
        setRaiseAmount(defaultRaiseAmount.toString());
    }, [defaultRaiseAmount]);

    const [showRaiseModal, setShowRaiseModal] = useState(false);

    // Provide default valid raise if modal opens
    React.useEffect(() => {
        if (showRaiseModal && !raiseAmount) {
            if (defaultRaiseAmount !== null) {
                setRaiseAmount(defaultRaiseAmount.toString());
            }
        }
    }, [showRaiseModal, defaultRaiseAmount, raiseAmount]);

    React.useEffect(() => {
        if (!betStep || betStep < gameState.bigBlind) {
            setBetStep(gameState.bigBlind);
        }
    }, [betStep, gameState.bigBlind]);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        if (betStep) {
            localStorage.setItem(BET_STEP_KEY, betStep.toString());
        }
    }, [betStep]);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        if (lastRaiseAmount !== null) {
            localStorage.setItem(LAST_RAISE_KEY, lastRaiseAmount.toString());
        }
    }, [lastRaiseAmount]);

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
        const capped = clampRaise(amount);
        placeBet(capped);
        setLastRaiseAmount(capped);
        setRaiseAmount('');
        setShowRaiseModal(false);
    };

    const handleAllIn = () => {
        goAllIn();
    };

    // Quick raise helpers
    const setQuickRaise = (type) => {
        if (!canAffordRaise) return;
        let amount = minRaiseTotal;
        const currentPot = gameState.pot + toCall; // Pot after calling

        switch (type) {
            case 'min':
                amount = minRaiseTotal;
                break;
            case 'max':
                amount = playerChips;
                break;
            case '1/3':
                amount = toCall + Math.floor(currentPot / 3);
                break;
            case '1/2':
                amount = toCall + Math.floor(currentPot / 2);
                break;
            case '2/3':
                amount = toCall + Math.floor((currentPot * 2) / 3);
                break;
            case 'pot':
                amount = toCall + currentPot;
                break;
            default:
                break;
        }

        const clamped = type === 'min' ? clampRaise(amount, false) : clampRaise(amount);
        setRaiseAmount(clamped.toString());
    };

    const handleIncrement = (direction) => {
        const current = parseFloat(raiseAmount) || defaultRaiseAmount || minRaiseTotal;
        const nextAmount = clampRaise(current + (betStep || gameState.bigBlind) * direction);
        setRaiseAmount(nextAmount.toString());
    };

    const handleRaiseBlur = () => {
        if (!raiseAmount) return;
        const amount = parseFloat(raiseAmount);
        if (!amount || isNaN(amount)) {
            if (defaultRaiseAmount !== null) {
                setRaiseAmount(defaultRaiseAmount.toString());
            }
            return;
        }
        setRaiseAmount(clampRaise(amount).toString());
    };

    const stepOptions = [1, 2, 5, 10];

    // Show showdown UI
    if (gameState.gameStage === 'showdown') {
        const canStartNextHand = gameState.players.filter(p => p.chips > 0).length >= 2;

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
                        canStartNextHand ? (
                            <button className={styles.nextHandBtn} onClick={nextHand}>
                                Start Next Hand
                            </button>
                        ) : (
                            <button
                                className={styles.nextHandBtn}
                                style={{ background: 'linear-gradient(135deg, #ff3b30, #e63228)', boxShadow: '0 4px 16px rgba(255, 59, 48, 0.35)' }}
                                onClick={resetGame}
                            >
                                Game Over - Reset Game
                            </button>
                        )
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
                    <button
                        className={`${styles.btn} ${styles.raise}`}
                        onClick={() => setShowRaiseModal(true)}
                        disabled={gameState.isTransitioning}
                    >
                        Raise...
                    </button>
                ) : (
                    !canCheck && canAffordCall && (
                        <button
                            className={`${styles.btn} ${styles.allIn}`}
                            onClick={handleAllIn}
                            disabled={gameState.isTransitioning}
                        >
                            All In ${playerChips}
                        </button>
                    )
                )}
            </div>

            {/* Raise Modal */}
            {showRaiseModal && createPortal(
                <div className={styles.raiseModalOverlay}>
                    <div className={styles.raiseModal}>
                        <button className={styles.closeModalBtn} onClick={() => setShowRaiseModal(false)}>
                            &times;
                        </button>

                        <div className={styles.raiseMeta}>
                            <span className={styles.raiseLabel}>Raise To</span>
                            <span className={styles.raiseRange}>Min ${minRaiseTotal} · Max ${playerChips}</span>
                            {lastRaiseAmount && (
                                <button
                                    className={styles.lastRaiseBtn}
                                    onClick={() => setRaiseAmount(clampRaise(lastRaiseAmount, false).toString())}
                                >
                                    Last ${lastRaiseAmount}
                                </button>
                            )}
                        </div>
                        <input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={minRaiseTotal}
                            max={playerChips}
                            step={betStep || gameState.bigBlind}
                            className={styles.raiseAmountInput}
                            value={raiseAmount}
                            onChange={(e) => setRaiseAmount(e.target.value)}
                            onBlur={handleRaiseBlur}
                        />

                        <div className={styles.sliderContainer}>
                            <div className={styles.sliderChipIcon}></div>
                            <input
                                type="range"
                                className={styles.slider}
                                min={minRaiseTotal}
                                max={playerChips}
                                step={betStep || gameState.bigBlind}
                                value={raiseAmount || defaultRaiseAmount || minRaiseTotal}
                                onChange={(e) => setRaiseAmount(e.target.value)}
                            />
                        </div>

                        <div className={styles.stepRow}>
                            <span className={styles.stepLabel}>Step Size</span>
                            <div className={styles.stepOptions}>
                                {stepOptions.map((multiplier) => {
                                    const stepValue = gameState.bigBlind * multiplier;
                                    const isActive = betStep === stepValue;
                                    return (
                                        <button
                                            key={multiplier}
                                            className={`${styles.stepBtn} ${isActive ? styles.stepBtnActive : ''}`}
                                            onClick={() => setBetStep(stepValue)}
                                        >
                                            {multiplier}x BB
                                        </button>
                                    );
                                })}
                            </div>
                            <div className={styles.stepCustom}>
                                <span>Custom</span>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    min={gameState.bigBlind}
                                    step={gameState.bigBlind}
                                    value={betStep}
                                    onChange={(e) => {
                                        const next = parseFloat(e.target.value);
                                        if (!next || isNaN(next)) return;
                                        setBetStep(Math.max(gameState.bigBlind, next));
                                    }}
                                    className={styles.stepInput}
                                />
                            </div>
                        </div>

                        <div className={styles.incrementRow}>
                            <button className={styles.incBtn} onClick={() => handleIncrement(-1)}>
                                &minus;
                            </button>
                            <button className={styles.incBtn} onClick={() => handleIncrement(1)}>
                                &#43;
                            </button>
                        </div>

                        <div className={styles.quickBtnGrid}>
                            <button className={`${styles.quickBtn} ${styles.darkBtn}`} onClick={() => setQuickRaise('min')}>Min</button>
                            <button className={`${styles.quickBtn} ${styles.actionBtn}`} onClick={() => setQuickRaise('max')}>Max</button>

                            <button className={`${styles.quickBtn} ${styles.actionBtn}`} onClick={() => setQuickRaise('1/3')}>1/3</button>
                            <button className={`${styles.quickBtn} ${styles.actionBtn}`} onClick={() => setQuickRaise('2/3')}>2/3</button>

                            <button className={`${styles.quickBtn} ${styles.actionBtn}`} onClick={() => setQuickRaise('1/2')}>1/2</button>
                            <button className={`${styles.quickBtn} ${styles.actionBtn}`} onClick={() => setQuickRaise('pot')}>Pot</button>
                        </div>

                        <button
                            className={styles.submitRaiseBtn}
                            onClick={handleRaise}
                            disabled={!raiseAmount || parseFloat(raiseAmount) < minRaiseTotal || parseFloat(raiseAmount) > playerChips}
                        >
                            Bet
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Controls;
