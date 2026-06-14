import { Chess } from 'chess.js'
import type { Move } from 'chess.js'
import { evaluate } from './evaluate'
import type { PersonalityWeights } from './personalities'

function orderMoves(moves: Move[], weights: PersonalityWeights): Move[] {
  return [...moves].sort((a, b) => {
    const aCapture = a.captured ? weights.attackBonus : 0
    const bCapture = b.captured ? weights.attackBonus : 0
    return bCapture - aCapture
  })
}

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  weights: PersonalityWeights,
  randomness: number,
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluate(game, weights, randomness)
  }

  const moves = orderMoves(game.moves({ verbose: true }), weights)

  if (isMaximizing) {
    let best = -Infinity
    for (const move of moves) {
      game.move(move)
      best = Math.max(best, minimax(game, depth - 1, alpha, beta, false, weights, randomness))
      game.undo()
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const move of moves) {
      game.move(move)
      best = Math.min(best, minimax(game, depth - 1, alpha, beta, true, weights, randomness))
      game.undo()
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

export function getBestMove(
  game: Chess,
  depth: number,
  weights: PersonalityWeights,
  randomness: number,
): Move | null {
  const moves = orderMoves(game.moves({ verbose: true }), weights)
  if (moves.length === 0) return null

  const isWhite = game.turn() === 'w'
  let bestMove: Move | null = null
  let bestScore = isWhite ? -Infinity : Infinity

  for (const move of moves) {
    game.move(move)
    const score = minimax(game, depth - 1, -Infinity, Infinity, !isWhite, weights, randomness)
    game.undo()

    if (isWhite ? score > bestScore : score < bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}