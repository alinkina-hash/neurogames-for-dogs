import { describe, expect, it } from 'vitest'
import { rawGames } from './games'
import { gameSchema } from './schema'

const busyBox = rawGames['busy-box'] as { variations: Record<string, unknown>[] }

function withVariation(change: Record<string, unknown>) {
  return { ...busyBox, variations: [{ ...busyBox.variations[0], ...change }] }
}

describe('game variations', () => {
  it('accepts a complete variation', () => {
    expect(gameSchema.safeParse(withVariation({})).success).toBe(true)
  })

  it('requires a video or photo', () => {
    expect(gameSchema.safeParse(withVariation({ media: [] })).success).toBe(false)
  })

  it('requires a source', () => {
    expect(gameSchema.safeParse(withVariation({ sources: [] })).success).toBe(false)
  })
})
