import { GAME_TYPES, type Game, type GameType } from '../content/schema'

export interface GameGroup {
  type: GameType
  games: Game[]
}

/** Groups games by their primary (first) type, in the canonical type order; empty groups are dropped. */
export function groupGamesByType(games: Game[]): GameGroup[] {
  return GAME_TYPES.map((type) => ({ type, games: games.filter((game) => game.types[0] === type) })).filter(
    (group) => group.games.length > 0,
  )
}
