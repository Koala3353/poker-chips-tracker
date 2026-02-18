# 🃏 Poker Chips Tracker

A sleek, real-time poker chip tracker for Texas Hold'em home games. Built for mobile-first landscape play — no scrolling, no distractions.

## ✨ Features

- **10-Seat Table** — Tap to add players, drag to rearrange seats
- **Auto Blinds** — Configurable small/big blind with automatic posting
- **Betting Controls** — Fold, Check, Call, Raise with intuitive touch buttons
- **All-In Support** — Bets auto-cap at player's chip count, purple All-In button
- **Side Pots** — Automatic side pot calculation when players go all-in with different stacks
- **Showdown** — Tap a player to award the pot; side pots distribute to eligible players only
- **Auto-Advance** — When all remaining players are all-in, streets auto-deal through to showdown
- **Responsive Design** — Full-screen landscape on iPhone/Android, proper layout on laptop/desktop
- **PWA Ready** — Add to home screen for an app-like experience

## 🛠️ Tech Stack

- **React 19** + **Vite**
- **CSS Modules** with glassmorphism & gradient design
- **Framer Motion** for drag interactions
- **No backend** — all state lives in React context + localStorage

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## 📱 Usage

1. **Setup** — Set buy-in and blind amounts, tap seats to add players
2. **Play** — Use the bottom action bar to Fold / Check / Call / Raise / All-In
3. **Showdown** — Tap the winning player to award the pot, then "Start Next Hand"

## 📄 License

MIT
