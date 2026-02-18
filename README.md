# Poker Chips Tracker

A sleek, real-time poker chip tracker for Texas Hold'em home games. Built for mobile-first landscape play — no scrolling, no distractions.

**[Live Demo](https://poker-chips-tracker.vercel.app)**

## Features

- **10-Seat Table** — Tap to add players, drag to rearrange seats
- **Auto Blinds** — Configurable small/big blind with automatic posting and rotation
- **Betting Controls** — Fold, Check, Call, Raise with intuitive touch buttons
- **All-In Support** — Bets auto-cap at player's chip count with a dedicated All-In button
- **Side Pots** — Automatic side pot calculation when players go all-in with different stacks
- **Showdown Awards** — Tap a player to award the pot; side pots distribute to eligible players only
- **Auto-Advance** — When all remaining players are all-in, streets auto-deal through to showdown
- **Landing Page** — Professional feature showcase before entering the game
- **Responsive Design** — Full-screen landscape on iPhone/Android, proper layout on laptop/desktop
- **PWA Ready** — Add to home screen for an app-like experience
- **Offline** — No accounts, no servers. All state lives on your device

## Tech Stack

- **React 19** + **Vite**
- **CSS Modules** — Glassmorphism, gradients, dark theme
- **Framer Motion** — Drag interactions
- **No backend** — React context + localStorage

## Getting Started

```bash
npm install
npm run dev
```

## Usage

1. **Landing** — View features, tap "Start a Game"
2. **Setup** — Set buy-in and blind amounts, tap seats to add players
3. **Play** — Use the bottom action bar to Fold / Check / Call / Raise / All-In
4. **Showdown** — Tap the winning player to award the pot, then "Start Next Hand"

## License

MIT
