import type { Game, GameType } from '../content/schema'

export function recommendGames(skill: GameType, games: Game[], count = 3): Game[] {
  return games
    .filter((g) => g.types[0] === skill)
    .sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title, 'ru'))
    .slice(0, count)
}
