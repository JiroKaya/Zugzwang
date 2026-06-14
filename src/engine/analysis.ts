export type MoveClassification =
  | 'brilliant'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'

export interface PositionEval {
  fen: string
  moveNumber: number
  moveSan: string
  color: 'w' | 'b'
  centipawns: number
  bestMove: string
  classification?: MoveClassification
  loss: number
  mateIn?: number   // signed: positive = white mates, negative = black mates
}

export interface GameAnalysis {
  positions: PositionEval[]
  whiteElo: number
  blackElo: number
  whiteAccuracy: number
  blackAccuracy: number
}

// Convert centipawns (white's perspective) to white's win probability 0-100
export function cpToWinPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1)
}

// Per-move accuracy from win% drop (Lichess formula)
export function moveAccuracy(winPercentBefore: number, winPercentAfter: number): number {
  const loss = Math.max(0, winPercentBefore - winPercentAfter)
  const acc = 103.1668 * Math.exp(-0.04354 * loss) - 3.1668
  return Math.max(0, Math.min(100, acc))
}

// Centipawn loss thresholds for classification
export function classifyMove(cpBefore: number, cpAfter: number, color: 'w' | 'b'): MoveClassification {
  const loss = color === 'w' ? cpBefore - cpAfter : cpAfter - cpBefore
  if (loss <= 0) return 'best'
  if (loss < 20) return 'excellent'
  if (loss < 50) return 'good'
  if (loss < 90) return 'inaccuracy'
  if (loss < 150) return 'mistake'
  return 'blunder'
}

// Rough ELO estimation based on average centipawn loss
export function estimateElo(avgCpLoss: number): number {
  // Formula derived from correlation between ACPL and ELO in real games
  // ELO ≈ 3000 * e^(-0.04 * acpl) clamped to 400-2800
  const elo = Math.round(3000 * Math.exp(-0.04 * avgCpLoss))
  return Math.max(400, Math.min(2800, elo))
}