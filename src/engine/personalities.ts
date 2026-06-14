export interface PersonalityWeights {
  material: number       // how much it values winning/losing pieces
  position: number       // how much it values piece placement
  kingSafety: number     // how much it cares about king protection
  pawnStructure: number  // how much it values pawn structure
  mobility: number       // how much it values having lots of available moves
  attackBonus: number    // how much it prioritizes aggressive/attacking moves
}

export const WEIGHT_BOUNDS = {
  min: 0,
  max: 10,
}

export const DEFAULT_WEIGHTS: PersonalityWeights = {
  material: 5,
  position: 5,
  kingSafety: 5,
  pawnStructure: 5,
  mobility: 5,
  attackBonus: 5,
}

export const PRESETS: Record<string, PersonalityWeights> = {
  balanced:   { material: 5,  position: 5,  kingSafety: 5,  pawnStructure: 5,  mobility: 5,  attackBonus: 5  },
  aggressive: { material: 3,  position: 6,  kingSafety: 2,  pawnStructure: 2,  mobility: 7,  attackBonus: 10 },
  defensive:  { material: 6,  position: 4,  kingSafety: 10, pawnStructure: 7,  mobility: 2,  attackBonus: 1  },
  positional: { material: 5,  position: 10, kingSafety: 6,  pawnStructure: 10, mobility: 6,  attackBonus: 2  },
  tactical:   { material: 7,  position: 3,  kingSafety: 4,  pawnStructure: 3,  mobility: 5,  attackBonus: 8  },
}