import React from 'react';
import { motion } from 'framer-motion';
import styles from '../assets/styles/Player.module.css';

const Player = ({ player, isActive, isDealer, isSelected, onClick, onDragEnd, isDraggable }) => {
    const initial = player.name.charAt(0).toUpperCase();

    return (
        <motion.div
            layout
            className={`${styles.player} ${isActive ? styles.active : ''} ${player.status === 'folded' ? styles.folded : ''} ${isSelected ? styles.selected : ''} ${isDraggable ? styles.draggable : ''}`}
            onClick={onClick}
            drag={isDraggable}
            dragMomentum={false}
            dragElastic={0.1}
            onDragEnd={(e, info) => isDraggable && onDragEnd && onDragEnd(e, info, player.id)}
            whileDrag={{ scale: 1.1, zIndex: 100, cursor: 'grabbing' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
        >
            {/* Bet badge floats above */}
            {player.currentBet > 0 && (
                <div className={styles.betBadge}>${player.currentBet}</div>
            )}

            {/* Main card */}
            <div className={styles.card}>
                <div className={styles.avatarRow}>
                    <div className={styles.avatar}>
                        {initial}
                    </div>
                    <div className={styles.details}>
                        <span className={styles.name}>{player.name}</span>
                        <span className={styles.chips}>${player.chips}</span>
                    </div>
                </div>
                {isDealer && <div className={styles.dealerChip}>D</div>}
            </div>

            {/* Status overlays */}
            {player.status === 'all-in' && <div className={styles.allInBadge}>ALL IN</div>}
        </motion.div>
    );
};

export default Player;
