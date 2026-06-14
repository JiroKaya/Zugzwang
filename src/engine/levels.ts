export interface DifficultyLevel {
  label: string
  elo: number
  depth: number        // how many moves ahead it thinks
  randomness: number   // centipawn noise added to eval (higher = more blunders)
}

export const LEVELS: DifficultyLevel[] = [
  { label: 'Level 1', elo: 200,  depth: 1, randomness: 300 },
  { label: 'Level 2', elo: 800,  depth: 2, randomness: 150 },
  { label: 'Level 3', elo: 1200, depth: 3, randomness: 80  },
  { label: 'Level 4', elo: 1600, depth: 4, randomness: 30  },
  { label: 'Level 5', elo: 1800, depth: 5, randomness: 10  },
  { label: 'Level 6', elo: 2000, depth: 6, randomness: 0   },
]