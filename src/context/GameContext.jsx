import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const GameContext = createContext();

const INITIAL_STATE = {
    players: [], // { id, name, chips, currentBet, status: 'active'|'folded'|'all-in'|'out', isDealer }
    pot: 0,
    pots: [], // [{ amount, eligible: [playerId, ...] }]
    handContributions: {}, // { playerId: totalChipsPutInThisHand }
    currentBet: 0,
    smallBlind: 5,
    bigBlind: 10,
    dealerIndex: 0,
    activePlayerIndex: 0,
    gameStage: 'setup', // setup, preflop, flop, turn, river, showdown
    history: [],
    isTransitioning: false,
};

const STORAGE_KEY = 'poker-tracker-state';
const STATS_KEY = 'poker-tracker-stats';

export const GameProvider = ({ children }) => {
    // Load initial state from local storage or use default
    const [gameState, setGameState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : INITIAL_STATE;
    });

    const [lifetimeStats, setLifetimeStats] = useState(() => {
        const saved = localStorage.getItem(STATS_KEY);
        return saved ? JSON.parse(saved) : { totalHands: 0, biggestPot: 0 };
    });

    // Helper to persist state changes
    const persistState = (newState) => {
        setGameState(newState);
    };

    // Persist state changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }, [gameState]);

    useEffect(() => {
        localStorage.setItem(STATS_KEY, JSON.stringify(lifetimeStats));
    }, [lifetimeStats]);

    const autoAdvanceTimerRef = useRef(null);

    // Helper: schedule auto-advance to next street after a delay
    // Sets isTransitioning immediately to lock betting buttons during the delay
    const scheduleAutoAdvance = (updatedPlayers, currentBet) => {
        if (autoAdvanceTimerRef.current) return;

        const active = updatedPlayers.filter(p => p.status === 'active');
        const allIn = updatedPlayers.filter(p => p.status === 'all-in');
        const nonFolded = updatedPlayers.filter(p => p.status !== 'folded' && p.status !== 'out');

        // Advance if: all active players acted & matched, OR no active players left (all folded/all-in)
        const allActed = active.every(p => p.hasActed);
        const allMatched = active.every(p => p.currentBet === currentBet);
        const shouldAdvance = (active.length > 0 && allActed && allMatched) ||
            (active.length === 0 && nonFolded.length > 0);

        if (shouldAdvance) {
            setGameState(prev => ({ ...prev, isTransitioning: true }));
            autoAdvanceTimerRef.current = setTimeout(() => {
                autoAdvanceTimerRef.current = null;
                nextStage();
            }, 1500);
        }
    };

    // Calculate side pots from handContributions
    const calculateSidePots = (players, contributions) => {
        // Get non-folded, non-out players who contributed
        const eligible = players
            .filter(p => p.status !== 'folded' && p.status !== 'out')
            .map(p => ({ id: p.id, contributed: contributions[p.id] || 0 }))
            .sort((a, b) => a.contributed - b.contributed);

        // Also include folded players' contributions (they go into the pot but player isn't eligible)
        const allContributors = players
            .filter(p => p.status !== 'out')
            .map(p => ({ id: p.id, contributed: contributions[p.id] || 0, isFolded: p.status === 'folded' }));

        if (eligible.length === 0) return [{ amount: 0, eligible: [] }];

        const pots = [];
        let processed = 0; // Amount already accounted for per player

        // Get unique contribution levels from eligible (non-folded) players
        const levels = [...new Set(eligible.map(p => p.contributed))].sort((a, b) => a - b);

        for (const level of levels) {
            const slicePerPlayer = level - processed;
            if (slicePerPlayer <= 0) continue;

            // Everyone who contributed at least this level puts in slicePerPlayer
            let potAmount = 0;
            const potEligible = [];

            for (const p of allContributors) {
                const available = Math.min(p.contributed - processed, slicePerPlayer);
                if (available > 0) {
                    potAmount += available;
                }
                // Only non-folded players who contributed at this level are eligible to win
                if (!p.isFolded && p.contributed >= level) {
                    potEligible.push(p.id);
                }
            }

            if (potAmount > 0) {
                pots.push({ amount: potAmount, eligible: potEligible });
            }
            processed = level;
        }

        // If there's remaining from folded players above the max eligible level, add to last pot
        const maxEligible = Math.max(...eligible.map(p => p.contributed));
        let remainder = 0;
        for (const p of allContributors) {
            if (p.contributed > maxEligible) {
                remainder += p.contributed - maxEligible;
            }
        }
        if (remainder > 0 && pots.length > 0) {
            pots[pots.length - 1].amount += remainder;
        }

        return pots.length > 0 ? pots : [{ amount: 0, eligible: [] }];
    };

    // Actions
    const addPlayer = (name, buyIn, targetSeatIndex) => {
        setGameState(prev => {
            const takenSeats = new Set(prev.players.map(p => p.seatIndex));

            let seatIndex;
            if (targetSeatIndex !== undefined && !takenSeats.has(targetSeatIndex)) {
                seatIndex = targetSeatIndex;
            } else {
                seatIndex = 0;
                while (takenSeats.has(seatIndex) && seatIndex < 10) {
                    seatIndex++;
                }
            }
            if (seatIndex >= 10) return prev;

            const newPlayer = {
                id: Date.now().toString(),
                name,
                chips: parseFloat(buyIn),
                currentBet: 0,
                status: 'active',
                isDealer: prev.players.length === 0,
                seatIndex
            };

            const newPlayers = [...prev.players, newPlayer].sort((a, b) => a.seatIndex - b.seatIndex);

            return {
                ...prev,
                players: newPlayers
            };
        });
    };

    const removePlayer = (playerId) => {
        setGameState(prev => {
            if (prev.gameStage !== 'setup') return prev;
            return {
                ...prev,
                players: prev.players.filter(p => p.id !== playerId)
            };
        });
    };

    // ... inside startGame ... (StartGame logic mainly resets betting, doesn't change seats usually)
    // But we should ensure logic allows for checks. 
    // Creating "movePlayerToSeat" action.


    const updateBlinds = (small, big) => {
        setGameState(prev => ({ ...prev, smallBlind: small, bigBlind: big }));
    };

    const updatePlayerChips = (playerId, newAmount) => {
        setGameState(prev => {
            const updatedPlayers = prev.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, chips: parseFloat(newAmount) };
                }
                return p;
            });
            return { ...prev, players: updatedPlayers };
        });
    };

    // Helper to find next active player
    const getNextActivePlayer = (currentIndex, players) => {
        let nextIndex = (currentIndex + 1) % players.length;
        let loopCount = 0;
        while (
            (players[nextIndex].status === 'folded' || players[nextIndex].status === 'out' || players[nextIndex].status === 'all-in') &&
            loopCount < players.length
        ) {
            nextIndex = (nextIndex + 1) % players.length;
            loopCount++;
        }
        return nextIndex;
    };

    const startGame = (initialSb, initialBb) => {
        if (gameState.players.length < 2) return;

        // Use provided values or current state
        const sbValue = initialSb !== undefined ? initialSb : gameState.smallBlind;
        const bbValue = initialBb !== undefined ? initialBb : gameState.bigBlind;

        // Ensure all players have a seat index and sort by seat
        const seatedPlayers = gameState.players
            .map((p, index) => ({
                ...p,
                seatIndex: p.seatIndex !== undefined ? p.seatIndex : index,
                status: p.chips > 0 ? 'active' : 'out',
                currentBet: 0,
                hasActed: false
            }))
            .sort((a, b) => a.seatIndex - b.seatIndex);

        // Calculate dealer, blinds, and first action
        const dealerIdx = 0;
        const playerCount = seatedPlayers.length;
        let sbIndex, bbIndex, firstActionIndex;

        if (playerCount === 2) {
            sbIndex = dealerIdx;
            bbIndex = (dealerIdx + 1) % playerCount;
            firstActionIndex = dealerIdx;
        } else {
            sbIndex = (dealerIdx + 1) % playerCount;
            bbIndex = (dealerIdx + 2) % playerCount;
            firstActionIndex = (dealerIdx + 3) % playerCount;
        }

        // Post blinds
        let currentPot = 0;
        const sbPlayer = seatedPlayers[sbIndex];
        const bbPlayer = seatedPlayers[bbIndex];

        // Track blind contributions
        const contributions = {};
        seatedPlayers.forEach(p => { contributions[p.id] = 0; });

        if (sbPlayer.status !== 'out') {
            const sbAmount = Math.min(sbValue, sbPlayer.chips);
            sbPlayer.chips -= sbAmount;
            sbPlayer.currentBet = sbAmount;
            if (sbPlayer.chips === 0) sbPlayer.status = 'all-in';
            currentPot += sbAmount;
            contributions[sbPlayer.id] = sbAmount;
        }

        if (bbPlayer.status !== 'out') {
            const bbAmount = Math.min(bbValue, bbPlayer.chips);
            bbPlayer.chips -= bbAmount;
            bbPlayer.currentBet = bbAmount;
            if (bbPlayer.chips === 0) bbPlayer.status = 'all-in';
            currentPot += bbAmount;
            contributions[bbPlayer.id] = bbAmount;
        }

        setGameState(prev => ({
            ...prev,
            players: seatedPlayers,
            dealerIndex: dealerIdx,
            activePlayerIndex: firstActionIndex,
            pot: currentPot,
            pots: [],
            handContributions: contributions,
            currentBet: bbValue,
            smallBlind: sbValue,
            bigBlind: bbValue,
            gameStage: 'preflop',
            isTransitioning: false,
        }));
    };

    const startHand = () => {
        setGameState(prev => {
            if (prev.gameStage !== 'seating' && prev.gameStage !== 'showdown') return prev;

            // If coming from seating, we might need to repost blinds effectively?
            // Actually the previous startGame did all the blinds posting.
            // Let's move the Blinds posting logic HERE, to `startHand`.
            // And keep `startGame` just for initialization of the Board.

            // Re-calc active/dealer indices if needed? 
            // In `seating`, dealer/active might change if people move seats?
            // YES. If people move seats, the order changes.
            // So we should re-poll the seats.

            // Sort players by seatIndex to ensure turn order is correct!
            const sortedPlayers = [...prev.players].sort((a, b) => (a.seatIndex || 0) - (b.seatIndex || 0));
            // Wait, we can't just change `players` array order easily if we rely on it elsewhere?
            // Actually, context usually relies on `players` array order for turn order? 
            // `turn order` usually follows seat order.

            // Let's assume `players` array order IS the turn order.
            // If dragging changes `seatIndex`, does it reorder the array?
            // `movePlayerToSeat` just updates `seatIndex`.

            // WE NEED TO SORT PLAYERS BY SEAT INDEX BEFORE STARTING HAND.

            const playersBySeat = [...prev.players].sort((a, b) => a.seatIndex - b.seatIndex);

            // Find Dealer
            // Dealer is tracked by ID usually? Or Index?
            // `dealerIndex` is index in `players` array.
            // If we re-sort array, `dealerIndex` points to wrong person unless we track by ID.

            // Let's find the dealer ID from prev state (if exists) or random.
            // In initial `setup`, dealerIndex is 0.

            const currentDealerId = prev.players[prev.dealerIndex].id;

            // New Dealer Index in sorted array
            const newDealerIndexInSorted = playersBySeat.findIndex(p => p.id === currentDealerId);

            // Rotate dealer for next hand? If this is the *first* hand, maybe not?
            // If `gameStage` was `seating`, this is first hand.
            // If `gameStage` was `showdown`, this is next hand (Logic is in `nextHand`).

            // Let's consolidate. `nextHand` logic is good.
            // `startHand` is for the very first hand after seating.

            // LOGIC FOR FIRST HAND:

            const nextDealerIndex = newDealerIndexInSorted; // Keep same dealer as initialized? Or rotate?
            // Let's just use standard logic.

            // Calc Blinds/Active based on sorted players
            let sbIndex, bbIndex, firstActionIndex;
            const playerCount = playersBySeat.length;

            if (playerCount === 2) {
                sbIndex = nextDealerIndex;
                bbIndex = (nextDealerIndex + 1) % playerCount;
                firstActionIndex = nextDealerIndex;
            } else {
                sbIndex = (nextDealerIndex + 1) % playerCount;
                bbIndex = (nextDealerIndex + 2) % playerCount;
                firstActionIndex = (nextDealerIndex + 3) % playerCount;
            }

            const activePlayers = playersBySeat.map(p => ({
                ...p,
                status: p.chips > 0 ? 'active' : 'out',
                currentBet: 0,
                hasActed: false
            }));

            // Post Blinds
            const sbPlayer = activePlayers[sbIndex];
            const bbPlayer = activePlayers[bbIndex];
            let currentPot = 0;

            if (sbPlayer.status !== 'out') {
                const sbAmount = Math.min(prev.smallBlind, sbPlayer.chips);
                sbPlayer.chips -= sbAmount;
                sbPlayer.currentBet = sbAmount;
                currentPot += sbAmount;
            }

            if (bbPlayer.status !== 'out') {
                const bbAmount = Math.min(prev.bigBlind, bbPlayer.chips);
                bbPlayer.chips -= bbAmount;
                bbPlayer.currentBet = bbAmount;
                currentPot += bbAmount;
            }

            return {
                ...prev,
                players: activePlayers,
                dealerIndex: nextDealerIndex,
                activePlayerIndex: firstActionIndex,
                pot: currentPot,
                currentBet: prev.bigBlind,
                gameStage: 'preflop',
                isTransitioning: false
            };
        });
    };

    const placeBet = (amount) => {
        setGameState(prev => {
            const player = prev.players[prev.activePlayerIndex];
            let betAmount = parseFloat(amount);

            // Cap bet at player's remaining chips
            betAmount = Math.min(betAmount, player.chips);
            if (betAmount <= 0) return prev;

            const totalBet = player.currentBet + betAmount;
            const newChips = player.chips - betAmount;
            const newPot = prev.pot + betAmount;
            const newCurrentBet = Math.max(prev.currentBet, totalBet);

            const updatedPlayers = [...prev.players];
            updatedPlayers[prev.activePlayerIndex] = {
                ...player,
                chips: newChips,
                currentBet: totalBet,
                status: newChips === 0 ? 'all-in' : 'active',
                hasActed: true
            };

            // Track contributions
            const newContributions = { ...prev.handContributions };
            newContributions[player.id] = (newContributions[player.id] || 0) + betAmount;

            const nextIndex = getNextActivePlayer(prev.activePlayerIndex, updatedPlayers);

            scheduleAutoAdvance(updatedPlayers, newCurrentBet);

            return {
                ...prev,
                players: updatedPlayers,
                pot: newPot,
                currentBet: newCurrentBet,
                activePlayerIndex: nextIndex,
                handContributions: newContributions
            };
        });
    };

    const goAllIn = () => {
        setGameState(prev => {
            const player = prev.players[prev.activePlayerIndex];
            const betAmount = player.chips;
            if (betAmount <= 0) return prev;

            const totalBet = player.currentBet + betAmount;
            const newPot = prev.pot + betAmount;
            const newCurrentBet = Math.max(prev.currentBet, totalBet);

            const updatedPlayers = [...prev.players];
            updatedPlayers[prev.activePlayerIndex] = {
                ...player,
                chips: 0,
                currentBet: totalBet,
                status: 'all-in',
                hasActed: true
            };

            const newContributions = { ...prev.handContributions };
            newContributions[player.id] = (newContributions[player.id] || 0) + betAmount;

            const nextIndex = getNextActivePlayer(prev.activePlayerIndex, updatedPlayers);

            scheduleAutoAdvance(updatedPlayers, newCurrentBet);

            return {
                ...prev,
                players: updatedPlayers,
                pot: newPot,
                currentBet: newCurrentBet,
                activePlayerIndex: nextIndex,
                handContributions: newContributions
            };
        });
    };

    const fold = () => {
        setGameState(prev => {
            const updatedPlayers = [...prev.players];
            updatedPlayers[prev.activePlayerIndex] = {
                ...updatedPlayers[prev.activePlayerIndex],
                status: 'folded',
                hasActed: true
            };

            // Check: only one non-folded/non-out player left?
            const remaining = updatedPlayers.filter(p => p.status !== 'folded' && p.status !== 'out');
            if (remaining.length === 1) {
                // Winner takes all pots
                const winner = remaining[0];
                const winnerIdx = updatedPlayers.findIndex(p => p.id === winner.id);
                updatedPlayers[winnerIdx] = {
                    ...updatedPlayers[winnerIdx],
                    chips: updatedPlayers[winnerIdx].chips + prev.pot
                };

                const newStats = {
                    ...lifetimeStats,
                    totalHands: lifetimeStats.totalHands + 1,
                    biggestPot: Math.max(lifetimeStats.biggestPot, prev.pot)
                };
                setLifetimeStats(newStats);

                return {
                    ...prev,
                    players: updatedPlayers,
                    pot: 0,
                    pots: [],
                    gameStage: 'showdown',
                };
            }

            const nextIndex = getNextActivePlayer(prev.activePlayerIndex, updatedPlayers);

            // Check if auto-advance needed (e.g., fold leaves only all-in players)
            scheduleAutoAdvance(updatedPlayers, prev.currentBet);

            return {
                ...prev,
                players: updatedPlayers,
                activePlayerIndex: nextIndex
            };
        });
    };

    const check = () => {
        setGameState(prev => {
            const updatedPlayers = [...prev.players];
            updatedPlayers[prev.activePlayerIndex] = {
                ...updatedPlayers[prev.activePlayerIndex],
                hasActed: true
            };
            const nextIndex = getNextActivePlayer(prev.activePlayerIndex, updatedPlayers);

            scheduleAutoAdvance(updatedPlayers, prev.currentBet);

            return {
                ...prev,
                players: updatedPlayers,
                activePlayerIndex: nextIndex
            };
        });
    };

    const nextStage = () => {
        setGameState(prev => {
            const stages = ['preflop', 'flop', 'turn', 'river', 'showdown'];
            const currentIdx = stages.indexOf(prev.gameStage);

            let nextStageName = 'preflop';

            if (currentIdx < stages.length - 1) {
                nextStageName = stages[currentIdx + 1];
            } else {
                return { ...prev, isTransitioning: false };
            }

            // Reset bets for new round
            const updatedPlayers = prev.players.map(p => ({
                ...p,
                currentBet: 0,
                hasActed: p.status === 'all-in' || p.status === 'folded' || p.status === 'out'
            }));

            // Calculate side pots when entering showdown or at each street
            const pots = calculateSidePots(updatedPlayers, prev.handContributions);

            // If going to showdown, just show pots
            if (nextStageName === 'showdown') {
                return {
                    ...prev,
                    gameStage: 'showdown',
                    players: updatedPlayers,
                    currentBet: 0,
                    pots: pots,
                    isTransitioning: false
                };
            }

            // Check if all remaining are all-in (no one can act)
            const activePlayers = updatedPlayers.filter(p => p.status === 'active');
            const nonFolded = updatedPlayers.filter(p => p.status !== 'folded' && p.status !== 'out');
            const shouldAutoAdvance = nonFolded.length > 1 && activePlayers.length <= 1;

            if (shouldAutoAdvance) {
                // Keep isTransitioning true and schedule next auto-advance
                // Use setTimeout to ensure state is committed first
                setTimeout(() => {
                    scheduleAutoAdvance(updatedPlayers, 0);
                }, 100);
            }

            // First active player left of dealer starts
            const nextActive = getNextActivePlayer(prev.dealerIndex, updatedPlayers);

            return {
                ...prev,
                gameStage: nextStageName,
                players: updatedPlayers,
                currentBet: 0,
                activePlayerIndex: nextActive,
                pots: pots,
                isTransitioning: shouldAutoAdvance // Stay locked if auto-advancing
            };
        });
    };

    const awardPot = (winnerIds) => {
        setGameState(prev => {
            // Calculate pots if not already done
            let pots = prev.pots.length > 0 ? [...prev.pots] :
                calculateSidePots(prev.players, prev.handContributions);

            let updatedPlayers = [...prev.players];
            let totalAwarded = 0;

            // Ensure winnerIds is an array
            const winners = Array.isArray(winnerIds) ? winnerIds : [winnerIds];

            // Award all pots where ANY of the winners are eligible
            const remainingPots = [];

            for (const pot of pots) {
                // Find which of the selected winners are eligible for this specific side pot
                const eligibleWinners = winners.filter(wId => pot.eligible.includes(wId));

                if (eligibleWinners.length > 0) {
                    // Split pot among eligible winners
                    const splitAmount = Math.floor(pot.amount / eligibleWinners.length);
                    const remainder = pot.amount % eligibleWinners.length;

                    eligibleWinners.forEach((wId, index) => {
                        const winnerIdx = updatedPlayers.findIndex(p => p.id === wId);
                        // Give remainder to the first eligible winner (simple rule)
                        const extra = index === 0 ? remainder : 0;

                        updatedPlayers[winnerIdx] = {
                            ...updatedPlayers[winnerIdx],
                            chips: updatedPlayers[winnerIdx].chips + splitAmount + extra
                        };
                    });
                    totalAwarded += pot.amount;
                } else {
                    remainingPots.push(pot);
                }
            }

            const newPot = remainingPots.reduce((sum, p) => sum + p.amount, 0);

            // Stats
            if (totalAwarded > 0) {
                const newStats = {
                    ...lifetimeStats,
                    totalHands: lifetimeStats.totalHands + (remainingPots.length === 0 ? 1 : 0),
                    biggestPot: Math.max(lifetimeStats.biggestPot, prev.pot)
                };
                setLifetimeStats(newStats);
            }

            return {
                ...prev,
                players: updatedPlayers,
                pot: newPot,
                pots: remainingPots,
                gameStage: 'showdown'
            };
        });
    };


    const resetGame = useCallback(() => {
        if (window.confirm("Are you sure you want to reset the game? This will clear all players and stats.")) {
            setGameState(INITIAL_STATE);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const nextHand = () => {
        setGameState(prev => {
            if (prev.gameStage !== 'showdown') return prev;

            // Rotate dealer
            const nextDealerIndex = (prev.dealerIndex + 1) % prev.players.length;

            // Determine SB/BB/Action
            let sbIndex, bbIndex, firstActionIndex;
            if (prev.players.length === 2) {
                sbIndex = nextDealerIndex;
                bbIndex = (nextDealerIndex + 1) % prev.players.length;
                firstActionIndex = nextDealerIndex;
            } else {
                sbIndex = (nextDealerIndex + 1) % prev.players.length;
                bbIndex = (nextDealerIndex + 2) % prev.players.length;
                firstActionIndex = (nextDealerIndex + 3) % prev.players.length;
            }

            const newPlayers = prev.players.map(p => ({
                ...p,
                status: p.chips > 0 ? 'active' : 'out',
                currentBet: 0,
                hasActed: false
            }));

            // Track blind contributions
            const contributions = {};
            newPlayers.forEach(p => { contributions[p.id] = 0; });

            // Post blinds
            const sbPlayer = newPlayers[sbIndex];
            const bbPlayer = newPlayers[bbIndex];
            let currentPot = 0;

            if (sbPlayer.status !== 'out') {
                const sbAmount = Math.min(prev.smallBlind, sbPlayer.chips);
                sbPlayer.chips -= sbAmount;
                sbPlayer.currentBet = sbAmount;
                if (sbPlayer.chips === 0) sbPlayer.status = 'all-in';
                currentPot += sbAmount;
                contributions[sbPlayer.id] = sbAmount;
            }

            if (bbPlayer.status !== 'out') {
                const bbAmount = Math.min(prev.bigBlind, bbPlayer.chips);
                bbPlayer.chips -= bbAmount;
                bbPlayer.currentBet = bbAmount;
                if (bbPlayer.chips === 0) bbPlayer.status = 'all-in';
                currentPot += bbAmount;
                contributions[bbPlayer.id] = bbAmount;
            }

            return {
                ...prev,
                dealerIndex: nextDealerIndex,
                activePlayerIndex: firstActionIndex,
                players: newPlayers,
                pot: currentPot,
                pots: [],
                handContributions: contributions,
                currentBet: prev.bigBlind,
                gameStage: 'preflop',
                isTransitioning: false
            };
        });
    };

    const movePlayerToSeat = (playerId, targetSeatIndex) => {
        setGameState(prev => {
            // Allow moving in 'setup' OR 'seating'
            if (prev.gameStage !== 'setup' && prev.gameStage !== 'seating') {
                return prev;
            }

            const existingPlayerInSeat = prev.players.find(p => p.seatIndex === targetSeatIndex);

            // Better Logic:
            const playerToMove = prev.players.find(p => p.id === playerId);
            const oldSeatIndex = playerToMove.seatIndex;

            const finalPlayers = prev.players.map(p => {
                if (p.id === playerId) {
                    return { ...p, seatIndex: targetSeatIndex };
                }
                if (p.seatIndex === targetSeatIndex) {
                    // This is the player being swapped out
                    return { ...p, seatIndex: oldSeatIndex };
                }
                return p;
            });

            return {
                ...prev,
                players: finalPlayers
            };
        });
    };

    const value = {
        gameState,
        addPlayer,
        removePlayer,
        updateBlinds,
        resetGame,
        startGame,
        startHand,
        placeBet,
        goAllIn,
        fold,
        check,
        nextStage,
        awardPot,
        movePlayerToSeat,
        nextHand,
        updatePlayerChips
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
