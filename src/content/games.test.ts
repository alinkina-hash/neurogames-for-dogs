import { describe, expect, it } from 'vitest'
import { rawGames } from './games'
import { gameSchema } from './schema'

describe('game content files', () => {
  const entries = Object.entries(rawGames)

  it('has at least one game', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  it.each(entries)('%s.json matches the schema', (_fileName, data) => {
    const result = gameSchema.safeParse(data)
    expect(result.error?.issues ?? []).toEqual([])
  })

  it.each(entries)('%s.json has an id equal to its file name', (fileName, data) => {
    expect((data as { id?: unknown }).id).toBe(fileName)
  })
})
