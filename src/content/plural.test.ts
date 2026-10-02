import { describe, expect, it } from 'vitest'
import { pluralRu } from './plural'

const games = (n: number) => `${n} ${pluralRu(n, ['игра', 'игры', 'игр'])}`

describe('pluralRu', () => {
  it.each([
    [1, '1 игра'],
    [2, '2 игры'],
    [4, '4 игры'],
    [5, '5 игр'],
    [11, '11 игр'],
    [12, '12 игр'],
    [14, '14 игр'],
    [21, '21 игра'],
    [40, '40 игр'],
    [51, '51 игра'],
    [53, '53 игры'],
    [111, '111 игр'],
  ])('%i → %s', (n, expected) => {
    expect(games(n)).toBe(expected)
  })
})
