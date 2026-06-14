import { Chess } from 'chess.js'
import type { Move } from 'chess.js'
import { getBestMove } from './minimax'
import { LEVELS } from './levels'
import type { DifficultyLevel } from './levels'
import type { PersonalityWeights } from './personalities'

export interface BotConfig {
  levelIndex: number
  weights: PersonalityWeights
  playerColor: 'w' | 'b'
  initialFen?: string
}

export function getBotMove(game: Chess, config: BotConfig): Move | null {
  const level: DifficultyLevel = LEVELS[config.levelIndex]
  return getBestMove(game, level.depth, config.weights, level.randomness)
}