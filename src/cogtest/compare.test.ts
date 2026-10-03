import { describe, expect, it } from 'vitest'
import { compareTests, daysBetween, previousTest } from './compare'
import type { CogTest, TaskId, TaskResult } from './types'

function done(score: 0 | 1 | 2 | 3): TaskResult {
  return { status: 'done', score }
}

function test(overrides: Partial<CogTest> & Pick<CogTest, 'id'>): CogTest {
  return {
    dogId: 'dog-1',
    protocolVersion: 1,
    startedAt: '2026-09-01T10:00:00Z',
    finishedAt: '2026-09-01T11:00:00Z',
    tasks: {},
    ...overrides,
  }
}

describe('previousTest', () => {
  const current = test({ id: 'cur', startedAt: '2026-10-01T10:00:00Z' })

  it('returns the most recent eligible test', () => {
    const older = test({ id: 'older', startedAt: '2026-07-01T10:00:00Z' })
    const newer = test({ id: 'newer', startedAt: '2026-08-01T10:00:00Z' })
    expect(previousTest([older, newer, current], current)?.id).toBe('newer')
  })

  it('ignores unfinished, other dogs, other protocol versions and later tests', () => {
    const tests = [
      test({ id: 'unfinished', finishedAt: undefined }),
      test({ id: 'other-dog', dogId: 'dog-2' }),
      test({ id: 'other-protocol', protocolVersion: 2 }),
      test({ id: 'later', startedAt: '2026-10-02T10:00:00Z' }),
    ]
    expect(previousTest(tests, current)).toBeUndefined()
  })
})

describe('compareTests', () => {
  it('compares tasks done in both tests', () => {
    const now = test({ id: 'a', tasks: { 'towel-find': done(3), 'which-hand': done(2) } })
    const before = test({ id: 'b', tasks: { 'towel-find': done(1), 'which-hand': done(2) } })
    const result = compareTests(now, before)
    expect(result.tasks['towel-find']).toEqual({ now: 3, before: 1, delta: 2 })
    expect(result.tasks['which-hand']).toEqual({ now: 2, before: 2, delta: 0 })
  })

  it('computes skill delta from both tasks', () => {
    const tasks = (a: 0 | 1 | 2 | 3, b: 0 | 1 | 2 | 3): Partial<Record<TaskId, TaskResult>> => ({
      'delayed-search': done(a),
      'distraction-search': done(b),
    })
    const result = compareTests(test({ id: 'a', tasks: tasks(3, 2) }), test({ id: 'b', tasks: tasks(1, 2) }))
    expect(result.skills.memory).toEqual({ now: 5, before: 3, delta: 2 })
  })

  it('omits a task skipped in either test and its skill', () => {
    const now = test({
      id: 'a',
      tasks: { 'delayed-search': done(3), 'distraction-search': { status: 'skipped', reason: 'refused' } },
    })
    const before = test({ id: 'b', tasks: { 'delayed-search': done(1), 'distraction-search': done(2) } })
    const result = compareTests(now, before)
    expect(result.tasks['distraction-search']).toBeUndefined()
    expect(result.tasks['delayed-search']).toBeDefined()
    expect(result.skills.memory).toBeUndefined()
  })
})

describe('daysBetween', () => {
  it('returns whole days, floored', () => {
    expect(daysBetween('2026-10-01T10:00:00Z', '2026-10-30T09:00:00Z')).toBe(28)
  })
})
