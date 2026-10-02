import { describe, expect, it } from 'vitest'
import type { Game, GameType } from '../content/schema'
import { groupGamesByType } from './groupGames'

const game = (id: string, types: GameType[]) => ({ id, types }) as Game

describe('groupGamesByType', () => {
  it('groups by the first type in canonical order and keeps the order of games', () => {
    const groups = groupGamesByType([
      game('wait', ['self-control']),
      game('cups', ['memory', 'scent']),
      game('mat', ['scent']),
      game('names', ['memory']),
    ])

    expect(groups.map((group) => [group.type, group.games.map((g) => g.id)])).toEqual([
      ['scent', ['mat']],
      ['memory', ['cups', 'names']],
      ['self-control', ['wait']],
    ])
  })

  it('returns no groups for an empty list', () => {
    expect(groupGamesByType([])).toEqual([])
  })
})
