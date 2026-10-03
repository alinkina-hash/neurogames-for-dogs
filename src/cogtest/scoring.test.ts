import { describe, expect, it } from 'vitest'
import { doneResult, scoreTask, summarizeTest, timerRaw } from './scoring'
import { PROTOCOL_VERSION, TEST_TASKS } from './tasks'
import type { DetourOutcome, RawResult, TaskId, TaskResult } from './types'

describe('scoreTask', () => {
  it.each([[0, 3], [15, 3], [15.9, 3], [16, 2], [60, 2], [61, 1], [119, 1]])(
    'towel-find found in %s s → %i', (s, p) => expect(scoreTask('towel-find', { seconds: s, found: true })).toBe(p))
  it('towel-find not found → 0', () => expect(scoreTask('towel-find', { seconds: 120, found: false })).toBe(0))
  it.each([[[true, true, true], 3], [[true, false, true], 2], [[false, false, false], 0]])(
    'trials %j → %i', (t, p) => expect(scoreTask('which-hand', { trials: t })).toBe(p))
  it.each([['fast', 3], ['slow', 2], ['barges', 1], ['gave-up', 0]])(
    'detour %s → %i', (o, p) => expect(scoreTask('detour', { outcome: o as DetourOutcome })).toBe(p))
  it.each([[60, 3], [59, 2], [15, 2], [14, 1], [3, 1], [2.9, 0], [0, 0]])(
    'leave-it %s s → %i', (s, p) => expect(scoreTask('leave-it', { seconds: s })).toBe(p))
  it.each([[15, 3], [14, 2], [5, 2], [4, 1], [1, 1], [0.9, 0]])(
    'bowl-wait %s s → %i', (s, p) => expect(scoreTask('bowl-wait', { seconds: s })).toBe(p))
  it.each([[120, true], [120, undefined], [150, true]])(
    'towel-find at the 2-minute limit (%s s, found=%s) → 0', (s, found) =>
      expect(scoreTask('towel-find', found === undefined ? { seconds: s } : { seconds: s, found })).toBe(0))
  it.each([[Number.NaN], [-5], [Number.POSITIVE_INFINITY]])('bad seconds %s count as 0 s', (s) => {
    expect(scoreTask('towel-find', { seconds: s, found: true })).toBe(3)
    expect(scoreTask('leave-it', { seconds: s })).toBe(0)
    expect(scoreTask('bowl-wait', { seconds: s })).toBe(0)
  })
})

describe('doneResult', () => {
  it('stores towel-find auto-stopped at the limit as not found, 0 points', () => {
    expect(doneResult('towel-find', { seconds: 120 })).toEqual({ status: 'done', score: 0, seconds: 120, found: false })
  })
  it('stores «Не нашла» as not found, 0 points', () => {
    expect(doneResult('towel-find', { seconds: 120, found: false })).toEqual({
      status: 'done', score: 0, seconds: 120, found: false,
    })
  })
  it.each([
    ['towel-find', { seconds: 120, found: false }],
    ['towel-find', { seconds: 120 }],
    ['towel-find', { seconds: 14 }],
    ['leave-it', { seconds: 30 }],
  ] as [TaskId, RawResult][])('re-saving an unchanged %s result %j keeps it', (id, raw) => {
    const existing = doneResult(id, raw)
    expect(doneResult(id, timerRaw(existing.seconds!, existing.found))).toEqual(existing)
  })
  it('stores whole non-negative seconds', () => {
    expect(doneResult('leave-it', { seconds: 15.7 })).toEqual({ status: 'done', score: 2, seconds: 15 })
    expect(doneResult('bowl-wait', { seconds: -3 })).toEqual({ status: 'done', score: 0, seconds: 0 })
    expect(doneResult('bowl-wait', { seconds: Number.NaN })).toEqual({ status: 'done', score: 0, seconds: 0 })
  })
  it('passes trials and outcomes through', () => {
    expect(doneResult('detour', { outcome: 'slow' })).toEqual({ status: 'done', score: 2, outcome: 'slow' })
    expect(doneResult('which-hand', { trials: [true, false, true] })).toEqual({
      status: 'done', score: 2, trials: [true, false, true],
    })
  })
})

const order: TaskId[] = [
  'towel-find', 'which-hand', 'delayed-search', 'distraction-search',
  'detour', 'empty-cup', 'leave-it', 'bowl-wait',
]

function done(score: 0 | 1 | 2 | 3): TaskResult {
  return { status: 'done', score }
}

function results(scores: (0 | 1 | 2 | 3)[]): Partial<Record<TaskId, TaskResult>> {
  return Object.fromEntries(order.map((id, i) => [id, done(scores[i])]))
}

describe('summarizeTest', () => {
  it('sums skills and total when all eight tasks are done', () => {
    const s = summarizeTest(results([3, 2, 3, 1, 2, 2, 0, 1]))
    expect(s.skills).toEqual({
      scent: { score: 5, max: 6, complete: true, done: 2 },
      memory: { score: 4, max: 6, complete: true, done: 2 },
      thinking: { score: 4, max: 6, complete: true, done: 2 },
      'self-control': { score: 1, max: 6, complete: true, done: 2 },
    })
    expect(s.total).toBe(14)
    expect(s.strongest).toEqual(['scent'])
    expect(s.weakest).toEqual(['self-control'])
  })

  it('marks a skill incomplete when a task is skipped and has no total', () => {
    const r = results([3, 2, 3, 1, 2, 2, 0, 1])
    r['leave-it'] = { status: 'skipped', reason: 'refused' }
    const s = summarizeTest(r)
    expect(s.skills['self-control']).toEqual({ score: 1, max: 3, complete: false, done: 1 })
    expect(s.total).toBeNull()
    expect(s.weakest).toEqual(['memory', 'thinking'])
    expect(s.strongest).toEqual(['scent'])
  })

  it('does not pick strongest or weakest with fewer than two complete skills', () => {
    const s = summarizeTest({ 'towel-find': done(3), 'which-hand': done(2), detour: done(1) })
    expect(s.strongest).toEqual([])
    expect(s.weakest).toEqual([])
    expect(s.total).toBeNull()
  })

  it('returns all tied skills', () => {
    const s = summarizeTest(results([3, 3, 2, 2, 2, 2, 3, 3]))
    expect(s.weakest).toEqual(['memory', 'thinking'])
    expect(s.strongest).toEqual(['scent', 'self-control'])
  })
})

describe('TEST_TASKS', () => {
  it('has eight unique tasks, two per skill, in spec order', () => {
    expect(TEST_TASKS.map((t) => t.id)).toEqual(order)
    expect(new Set(TEST_TASKS.map((t) => t.id)).size).toBe(8)
    for (const skill of ['scent', 'memory', 'thinking', 'self-control']) {
      expect(TEST_TASKS.filter((t) => t.skill === skill)).toHaveLength(2)
    }
    expect(PROTOCOL_VERSION).toBe(1)
  })
})
