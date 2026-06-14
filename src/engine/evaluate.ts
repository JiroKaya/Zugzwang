import { Chess } from 'chess.js'
import { PIECE_VALUES, PIECE_TABLES } from './tables'
import type { PersonalityWeights } from './personalities'

function normalize(weight: number): number {
  // converts 0-10 scale to a multiplier (5 = 1x, 10 = 2x, 0 = 0x)
  return weight / 5
}

export function evaluate(game: Chess, weights: PersonalityWeights, randomness: number): number {
  if (game.isCheckmate()) return game.turn() === 'w' ? -99999 : 99999
  if (game.isDraw() || game.isStalemate()) return 0

  let score = 0

  score += materialScore(game) * normalize(weights.material)
  score += positionScore(game) * normalize(weights.position)
  score += mobilityScore(game) * normalize(weights.mobility)
  score += kingSafetyScore(game) * normalize(weights.kingSafety)
  score += pawnStructureScore(game) * normalize(weights.pawnStructure)

  if (randomness > 0) {
    score += (Math.random() - 0.5) * 2 * randomness
  }

  return score
}

function materialScore(game: Chess): number {
  let score = 0
  const board = game.board()

  for (const row of board) {
    for (const square of row) {
      if (!square) continue
      const value = PIECE_VALUES[square.type] ?? 0
      score += square.color === 'w' ? value : -value
    }
  }

  return score
}

function positionScore(game: Chess): number {
  let score = 0
  const board = game.board()

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file]
      if (!square) continue

      const table = PIECE_TABLES[square.type]
      if (!table) continue

      const index = square.color === 'w'
        ? rank * 8 + file
        : (7 - rank) * 8 + file

      const bonus = table[index]
      score += square.color === 'w' ? bonus : -bonus
    }
  }

  return score
}

function mobilityScore(game: Chess): number {
  const moves = game.moves().length
  return game.turn() === 'w' ? moves * 2 : -moves * 2
}

function kingSafetyScore(game: Chess): number {
  let score = 0
  const board = game.board()

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file]
      if (!square || square.type !== 'k') continue

      const isWhite = square.color === 'w'
      const centerDistance = Math.abs(file - 3.5) + Math.abs(rank - 3.5)

      if (centerDistance < 3) score += isWhite ? -30 : 30
      if ((isWhite && rank === 7) || (!isWhite && rank === 0)) {
        score += isWhite ? 20 : -20
      }
    }
  }

  return score
}

function pawnStructureScore(game: Chess): number {
  let score = 0
  const board = game.board()

  const whitePawnsPerFile = new Array(8).fill(0)
  const blackPawnsPerFile = new Array(8).fill(0)

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file]
      if (!square || square.type !== 'p') continue
      if (square.color === 'w') whitePawnsPerFile[file]++
      else blackPawnsPerFile[file]++
    }
  }

  for (let file = 0; file < 8; file++) {
    // doubled pawns
    if (whitePawnsPerFile[file] > 1) score -= 20 * (whitePawnsPerFile[file] - 1)
    if (blackPawnsPerFile[file] > 1) score += 20 * (blackPawnsPerFile[file] - 1)

    // isolated pawns
    const leftFile = file - 1
    const rightFile = file + 1
    const hasWhiteNeighbor =
      (leftFile >= 0 && whitePawnsPerFile[leftFile] > 0) ||
      (rightFile < 8 && whitePawnsPerFile[rightFile] > 0)
    const hasBlackNeighbor =
      (leftFile >= 0 && blackPawnsPerFile[leftFile] > 0) ||
      (rightFile < 8 && blackPawnsPerFile[rightFile] > 0)

    if (whitePawnsPerFile[file] > 0 && !hasWhiteNeighbor) score -= 15
    if (blackPawnsPerFile[file] > 0 && !hasBlackNeighbor) score += 15
  }

  return score
}