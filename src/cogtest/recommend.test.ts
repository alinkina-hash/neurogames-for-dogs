import { describe, expect, it } from 'vitest'
import { games } from '../content/games'
import { recommendGames } from './recommend'

describe('recommendGames', () => {
  it('returns easiest games whose first type is the skill', () => {
    const result = recommendGames('memory', games)
    expect(result).toHaveLength(3)
    expect(result.every((g) => g.types[0] === 'memory')).toBe(true)
    const difficulties = result.map((g) => g.difficulty)
    expect(difficulties).toEqual([...difficulties].sort((a, b) => a - b))
  })

  it('respects count', () => {
    expect(recommendGames('memory', games, 1)).toHaveLength(1)
  })
})
