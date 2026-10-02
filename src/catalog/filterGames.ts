import type { Difficulty, Game, GameType } from '../content/schema'

export interface CatalogFilter {
  /** Games matching any of these types are kept; empty or missing means all types. */
  types?: GameType[]
  difficulty?: Difficulty
  noEquipment?: boolean
}

export function filterGames(games: Game[], filter: CatalogFilter): Game[] {
  const types = filter.types ?? []
  return games.filter(
    (game) =>
      (types.length === 0 || game.types.some((type) => types.includes(type))) &&
      (!filter.difficulty || game.difficulty === filter.difficulty) &&
      (!filter.noEquipment || game.equipment.length === 0),
  )
}

/** Adds the type to the selection, or removes it if it is already selected. */
export function toggleType(selected: GameType[], type: GameType): GameType[] {
  return selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type]
}
