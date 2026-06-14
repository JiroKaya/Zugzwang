# ♟ Zugzwang

A chess bot you can play against in your browser — with customizable difficulty, personality presets, and full post-game analysis powered by Stockfish.

> **Zugzwang** _/ˈtsuːktsvaŋ/_ — a situation in chess where any move a player makes worsens their position.

## Features

- **Play against a custom AI** — built from scratch with minimax search and alpha-beta pruning
- **6 difficulty levels** — from beginner (~200 ELO) to advanced (~2000 ELO)
- **5 play styles** — Balanced, Aggressive, Defensive, Positional, Tactical — each with distinct evaluation weights
- **Full game analysis** — powered by Stockfish 18 running in-browser via WebAssembly
- **Move classifications** — every move rated from Brilliant to Blunder
- **Accuracy & ELO estimates** — per-player performance rating after each game
- **PGN import** — paste a game from chess.com or Lichess and analyze it
- **Step-through analysis** — navigate move by move with keyboard arrows
- **Eval bar** — visual advantage indicator during analysis
- **Promotion picker** — choose your promotion piece
- **Play as white, black, or random**
- **Flip board** support

## Tech Stack

- **React** + **TypeScript** (Vite)
- **Tailwind CSS** for styling
- **chess.js** for move generation and game rules
- **react-chessboard** for the board UI
- **Stockfish 18** (WASM) for post-game analysis

## Getting Started

```bash
git clone https://github.com/JiroKaya/zugzwang.git
cd zugzwang
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How the Bot Works

The bot uses a **minimax search algorithm** with **alpha-beta pruning** to find moves. The evaluation function scores positions based on:

- **Material** — piece values
- **Position** — piece-square tables rewarding good squares
- **King safety** — penalizing exposed kings
- **Pawn structure** — penalizing doubled and isolated pawns
- **Mobility** — rewarding more available moves

Each play style adjusts these weights differently. The Aggressive style values attacks and mobility over king safety, while the Defensive style does the opposite.

Difficulty is controlled by **search depth** (how many moves ahead the bot thinks) and **randomness** (noise added to the evaluation to simulate mistakes).

## Analysis

Post-game analysis runs Stockfish 18 in a Web Worker. Each position is evaluated at depth 12 and moves are classified based on centipawn loss:

| Classification | Centipawn Loss |
| -------------- | -------------- |
| Best           | ≤ 0            |
| Excellent      | < 20           |
| Good           | < 50           |
| Inaccuracy     | < 90           |
| Mistake        | < 150          |
| Blunder        | ≥ 150          |

Accuracy is calculated using a win-percentage model, and ELO is estimated from average centipawn loss.
