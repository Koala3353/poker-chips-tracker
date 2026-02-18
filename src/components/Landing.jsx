import React from 'react';
import styles from '../assets/styles/Landing.module.css';

const FEATURES = [
    {
        title: 'Live Chip Tracking',
        desc: 'Real-time chip counts for up to 10 players. No pen and paper needed.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
            </svg>
        ),
    },
    {
        title: 'All-In & Side Pots',
        desc: 'Automatic side pot calculation when players go all-in with different stacks.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
        ),
    },
    {
        title: 'Auto Blinds',
        desc: 'Configurable small and big blinds. Automatically posted and rotated each hand.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v1m0 16v1m-9-9h1m16 0h1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707" />
                <circle cx="12" cy="12" r="4" />
            </svg>
        ),
    },
    {
        title: 'Showdown Awards',
        desc: 'Tap the winner to award the pot. Side pots distribute only to eligible players.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
                <path d="M12 3v12" />
                <path d="M5 21h14" />
            </svg>
        ),
    },
    {
        title: 'Mobile First',
        desc: 'Designed for landscape phones. Full-screen, no scrolling, touch-optimized controls.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
        ),
    },
    {
        title: 'No Account Needed',
        desc: 'Works offline. No sign-ups, no servers. Your game stays on your device.',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
    },
];

const Landing = ({ onStart }) => {
    return (
        <div className={styles.landing}>
            {/* Ambient glow */}
            <div className={styles.glow} />

            <header className={styles.hero}>
                <p className={styles.tag}>Texas Hold'em Utility</p>
                <h1 className={styles.title}>Poker Chips Tracker</h1>
                <p className={styles.subtitle}>
                    A minimal, distraction-free chip tracker for home games.
                    Track bets, blinds, all-ins, and side pots — all from your phone.
                </p>
                <button className={styles.cta} onClick={onStart}>
                    Start a Game
                </button>
            </header>

            <section className={styles.features}>
                {FEATURES.map((f, i) => (
                    <div key={i} className={styles.featureCard}>
                        <div className={styles.featureIcon}>{f.icon}</div>
                        <h3 className={styles.featureTitle}>{f.title}</h3>
                        <p className={styles.featureDesc}>{f.desc}</p>
                    </div>
                ))}
            </section>

            <footer className={styles.footer}>
                <p>Built for the table, not the screen.</p>
            </footer>
        </div>
    );
};

export default Landing;
