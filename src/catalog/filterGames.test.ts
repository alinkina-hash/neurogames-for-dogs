import { describe, expect, it } from 'vitest'
import type { Game } from '../content/schema'
import { filterGames, toggleType } from './filterGames'

function game(overrides: Partial<Game> & Pick<Game, 'id'>): Game {
  return {
    title: overrides.id,
    types: ['scent'],
    goal: 'goal',
    difficulty: 1,
    equipment: ['mat'],
    prepMinutes: 1,
    sessionMinutes: { min: 5, max: 10 },
    steps: ['step'],
    levels: [
      { level: 1, description: 'one' },
      { level: 2, description: 'two' },
      { level: 3, description: 'three' },
    ],
    stopSignals: ['stop'],
    safety: ['safe'],
    sources: [{ title: 'source', url: 'https://example.com' }],
    ...overrides,
  }
}

const games = [
  game({ id: 'mat' }),
  game({ id: 'cups', types: ['memory', 'scent'], difficulty: 2 }),
  game({ id: 'wait', types: ['self-control'], difficulty: 3, equipment: [] }),
]

const ids = (result: Game[]) => result.map((g) => g.id)

describe('filterGames', () => {
  it('returns every game for an empty filter', () => {
    expect(ids(filterGames(games, {}))).toEqual(['mat', 'cups', 'wait'])
  })

  it('returns every game when no types are selected', () => {
    expect(ids(filterGames(games, { types: [] }))).toEqual(['mat', 'cups', 'wait'])
  })

  it('matches a game by any of its types', () => {
    expect(ids(filterGames(games, { types: ['scent'] }))).toEqual(['mat', 'cups'])
  })

  it('keeps games of any selected type', () => {
    expect(ids(filterGames(games, { types: ['memory', 'self-control'] }))).toEqual(['cups', 'wait'])
  })

  it('filters by difficulty', () => {
    expect(ids(filterGames(games, { difficulty: 2 }))).toEqual(['cups'])
  })

  it('keeps only games that need no equipment', () => {
    expect(ids(filterGames(games, { noEquipment: true }))).toEqual(['wait'])
  })

  it('combines conditions', () => {
    expect(ids(filterGames(games, { types: ['scent'], difficulty: 3 }))).toEqual([])
  })
})

describe('toggleType', () => {
  it('adds a type that is not selected', () => {
    expect(toggleType(['scent'], 'memory')).toEqual(['scent', 'memory'])
  })

  it('removes a type that is already selected', () => {
    expect(toggleType(['scent', 'memory'], 'scent')).toEqual(['memory'])
  })
})
