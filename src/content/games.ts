import { gameSchema, type Game } from './schema'

const files = import.meta.glob<unknown>('./games/*.json', { eager: true, import: 'default' })

/** Raw game files keyed by file name without extension, e.g. "snuffle-mat". */
export const rawGames: Record<string, unknown> = Object.fromEntries(
  Object.entries(files).map(([path, data]) => [path.replace(/^.*\/|\.json$/g, ''), data]),
)

export const games: Game[] = Object.values(rawGames)
  .map((data) => gameSchema.parse(data))
  .sort((a, b) => a.difficulty - b.difficulty || a.title.localeCompare(b.title, 'ru'))

export function findGame(id: string | undefined): Game | undefined {
  return games.find((game) => game.id === id)
}
