import type { Difficulty, Game, GameType } from '../content/schema'

export interface CatalogFilter {
  type?: GameType
  difficulty?: Difficulty
  noEquipment?: boolean
}

export function filterGames(games: Game[], filter: CatalogFilter): Game[] {
  return games.filter(
    (game) =>
      (!filter.type || game.types.includes(filter.type)) &&
      (!filter.difficulty || game.difficulty === filter.difficulty) &&
      (!filter.noEquipment || game.equipment.length === 0),
  )
}
