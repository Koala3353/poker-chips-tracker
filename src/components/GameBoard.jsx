import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import Player from './Player';
import Controls from './Controls';
import styles from '../assets/styles/GameBoard.module.css';
import CommunityCards from './CommunityCards';

import DealerControls from './DealerControls';

const GameBoard = () => {
    const { gameState, movePlayerToSeat, awardPot } = useGame();
    const [selectedPlayerId, setSelectedPlayerId] = React.useState(null);

    // 10 fixed positions (0 at bottom, clockwise)
    const SEAT_POSITIONS = [
        { left: '50%', top: '88%' }, // 0: Bottom (Hero)
        { left: '20%', top: '80%' }, // 1
        { left: '5%', top: '55%' }, // 2
        { left: '10%', top: '30%' }, // 3
        { left: '30%', top: '15%' }, // 4
        { left: '50%', top: '12%' }, // 5: Top
        { left: '70%', top: '15%' }, // 6
        { left: '90%', top: '30%' }, // 7
        { left: '95%', top: '55%' }, // 8
        { left: '80%', top: '80%' }, // 9
    ];

    const handleSeatClick = (seatIndex) => {
        if (selectedPlayerId) {
            // If a player is selected, move them to this seat (or swap if occupied)
            movePlayerToSeat(selectedPlayerId, seatIndex);
            setSelectedPlayerId(null); // Deselect after move
        }
    };

    const handlePlayerClick = (playerId) => {
        if (gameState.gameStage === 'showdown') {
            // Confirm winner selection
            const player = gameState.players.find(p => p.id === playerId);
            if (player && player.status !== 'folded' && player.status !== 'out') {
                if (window.confirm(`Award pot of $${gameState.pot} to ${player.name}?`)) {
                    awardPot(player.id);
                }
            }
            return;
        }

        if (gameState.gameStage !== 'setup') return; // Disable seat/player clicking during game

        if (selectedPlayerId === playerId) {
            setSelectedPlayerId(null); // Deselect if clicking self
        } else if (selectedPlayerId) {
            movePlayerToSeat(selectedPlayerId, gameState.players.find(p => p.id === playerId)?.seatIndex);
            setSelectedPlayerId(null);
        } else {
            setSelectedPlayerId(playerId); // Select
        }
    };

    const handleDragEnd = (event, info, playerId) => {
        const dropPoint = {
            x: event.clientX,
            y: event.clientY
        };

        // Find nearest seat
        let nearestSeatIndex = -1;
        let minDistance = Infinity;

        // We need to know the absolute positions of seats on screen.
        // Since seats are %. We can try to use document.elementsFromPoint or calculate bounding rects.
        // Simpler: iterate over all seat containers and get their bounding rects.

        const seatElements = document.querySelectorAll(`.${styles.seatContainer}`);
        seatElements.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            const seatCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            // Calculate distance
            const distance = Math.hypot(dropPoint.x - seatCenter.x, dropPoint.y - seatCenter.y);

            // Threshold for snapping (e.g., 60px radius)
            if (distance < 80 && distance < minDistance) {
                minDistance = distance;
                nearestSeatIndex = index; // The index in DOM order should match SEAT_POSITIONS order if rendered correctly
            }
        });

        // The seatElements order might not match index if React re-orders? 
        // No, map preserves order. But let's be safe. 
        // Actually, we can just attach the index as data-attribute to the seat container.

        if (nearestSeatIndex !== -1) {
            movePlayerToSeat(playerId, nearestSeatIndex);
        }
    };

    return (
        <div className={styles.board}>
            <DealerControls />
            <div className={styles.table}>
                <div className={styles.potContainer}>
                    <div className={styles.potLabel}>POT</div>
                    <div className={styles.potValue}>${gameState.pot}</div>
                    <div className={styles.stageLabel}>{gameState.gameStage}</div>

                    {/* Show side pots breakdown */}
                    {gameState.pots && gameState.pots.length > 1 && (
                        <div className={styles.sidePots}>
                            {gameState.pots.map((pot, i) => (
                                <div key={i} className={styles.sidePot}>
                                    {i === 0 ? 'Main' : `Side ${i}`}: ${pot.amount}
                                </div>
                            ))}
                        </div>
                    )}

                    <CommunityCards stage={gameState.gameStage} />
                </div>

                {/* Render 10 Seats */}
                {SEAT_POSITIONS.map((pos, index) => {
                    const player = gameState.players.find(p => p.seatIndex === index);

                    return (
                        <div
                            key={index}
                            data-index={index} // Helper for drag detection if needed, though we use index from loop above for direct correlation if querySelector returns in order
                            className={styles.seatContainer}
                            style={{ ...pos, transform: 'translate(-50%, -50%)' }}
                            onClick={() => !player && handleSeatClick(index)}
                        >
                            {player ? (
                                <Player
                                    player={player}
                                    isActive={gameState.players.indexOf(player) === gameState.activePlayerIndex}
                                    isDealer={gameState.players.indexOf(player) === gameState.dealerIndex}
                                    isSelected={selectedPlayerId === player.id}
                                    isDraggable={gameState.gameStage === 'setup' || gameState.gameStage === 'seating'}
                                    onDragEnd={handleDragEnd}
                                    onClick={(e) => {
                                        // prevent click if it was a drag? handled by framer motion usually distinguishing tap vs drag
                                        e.stopPropagation();
                                        handlePlayerClick(player.id);
                                    }}
                                />
                            ) : (
                                <div className={`${styles.emptySeat} ${selectedPlayerId ? styles.highlight : ''}`}>
                                    {selectedPlayerId && <div className={styles.plusIcon}>+</div>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Controls />
        </div>
    );
};

export default GameBoard;
