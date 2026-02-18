import React from 'react';
import { motion } from 'framer-motion';
import styles from '../assets/styles/CommunityCards.module.css';

const CommunityCards = ({ stage }) => {
    // Determine how many cards to show
    let cardCount = 0;
    if (stage === 'flop') cardCount = 3;
    if (stage === 'turn') cardCount = 4;
    if (stage === 'river' || stage === 'showdown') cardCount = 5;

    if (cardCount === 0) return null;

    const cards = Array.from({ length: cardCount });

    return (
        <div className={styles.container}>
            {cards.map((_, index) => (
                <motion.div
                    key={index}
                    className={styles.card}
                    initial={{ opacity: 0, scale: 0.5, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.1, type: 'spring' }}
                >
                    <div className={styles.cardPattern}></div>
                </motion.div>
            ))}
        </div>
    );
};

export default CommunityCards;
