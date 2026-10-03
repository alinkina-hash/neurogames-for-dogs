import { describe, expect, it } from 'vitest'
import { reducer, unfinishedTest, type Action } from './reducer'
import { emptyStore, storeSchema } from './storage'
import type { Store } from './types'

const NOW = '2026-10-03T10:00:00.000Z'
const LATER = '2026-10-03T11:00:00.000Z'

function counter() {
  let n = 0
  return () => `id-${++n}`
}

function run(store: Store, actions: Action[], ids = counter()): Store {
  return actions.reduce((s, a) => reducer(s, a, ids), store)
}

const withDogs = () =>
  run(emptyStore(), [{ type: 'addDogs', dogs: [{ name: 'Рекс' }, { name: 'Бим' }], now: NOW }])

describe('addDogs', () => {
  it('adds two dogs with trimmed names', () => {
    const s = run(emptyStore(), [
      { type: 'addDogs', dogs: [{ name: '  Рекс ' }, { name: 'Бим', breed: ' лабрадор ', birthMonth: '2020-05' }], now: NOW },
    ])
    expect(s.dogs).toEqual([
      { id: 'id-1', name: 'Рекс', createdAt: NOW },
      { id: 'id-2', name: 'Бим', breed: 'лабрадор', birthMonth: '2020-05', createdAt: NOW },
    ])
  })

  it('rejects an empty name (store unchanged)', () => {
    const before = emptyStore()
    expect(run(before, [{ type: 'addDogs', dogs: [{ name: '   ' }], now: NOW }])).toBe(before)
  })

  it('drops empty breed and birthMonth keys', () => {
    const s = run(emptyStore(), [
      { type: 'addDogs', dogs: [{ name: 'Рекс', breed: ' ', birthMonth: '' }], now: NOW },
    ])
    expect(s.dogs[0]).toEqual({ id: 'id-1', name: 'Рекс', createdAt: NOW })
    expect('breed' in s.dogs[0]).toBe(false)
    expect('birthMonth' in s.dogs[0]).toBe(false)
  })
})

describe('birthMonth validation', () => {
  it('drops an invalid birthMonth on add and update, keeping the store schema-valid', () => {
    const bad = ['2020-5', '2020-13', 'May 2020', '2020-00']
    let s = run(emptyStore(), [
      { type: 'addDogs', dogs: bad.map((birthMonth, i) => ({ name: `D${i}`, birthMonth })), now: NOW },
    ])
    expect(s.dogs.every((d) => !('birthMonth' in d))).toBe(true)
    s = run(s, [{ type: 'updateDog', dogId: 'id-1', name: 'D0', birthMonth: '2020-13' }])
    expect('birthMonth' in s.dogs[0]).toBe(false)
    expect(storeSchema.safeParse(s).success).toBe(true)
  })

  it('keeps a valid birthMonth', () => {
    const s = run(emptyStore(), [{ type: 'addDogs', dogs: [{ name: 'A', birthMonth: '2020-12' }], now: NOW }])
    expect(s.dogs[0].birthMonth).toBe('2020-12')
  })
})

describe('updateDog', () => {
  it('updates and trims, removing emptied fields', () => {
    const s0 = run(emptyStore(), [
      { type: 'addDogs', dogs: [{ name: 'Рекс', breed: 'лайка' }], now: NOW },
    ])
    const s = run(s0, [{ type: 'updateDog', dogId: 'id-1', name: ' Макс ', breed: '', birthMonth: '2019-01' }])
    expect(s.dogs[0]).toEqual({ id: 'id-1', name: 'Макс', birthMonth: '2019-01', createdAt: NOW })
  })

  it('rejects empty name and unknown dog', () => {
    const s0 = withDogs()
    expect(run(s0, [{ type: 'updateDog', dogId: 'id-1', name: ' ' }])).toBe(s0)
    expect(run(s0, [{ type: 'updateDog', dogId: 'nope', name: 'X' }])).toBe(s0)
  })
})

describe('startTest / unfinishedTest', () => {
  it('starts a test with protocolVersion', () => {
    const s = run(withDogs(), [{ type: 'startTest', dogId: 'id-1', now: NOW, testId: 't1' }])
    expect(s.tests).toEqual([
      { id: 't1', dogId: 'id-1', protocolVersion: 1, startedAt: NOW, tasks: {} },
    ])
    expect(unfinishedTest(s, 'id-1')?.id).toBe('t1')
    expect(unfinishedTest(s, 'id-2')).toBeUndefined()
  })

  it('leaves the store unchanged if the dog already has an unfinished test', () => {
    const s1 = run(withDogs(), [{ type: 'startTest', dogId: 'id-1', now: NOW, testId: 't1' }])
    expect(run(s1, [{ type: 'startTest', dogId: 'id-1', now: LATER, testId: 't2' }])).toBe(s1)
  })

  it('ignores an unknown dog', () => {
    const s0 = withDogs()
    expect(run(s0, [{ type: 'startTest', dogId: 'nope', now: NOW, testId: 't1' }])).toBe(s0)
  })

  it('allows a new test after finishing', () => {
    const s = run(withDogs(), [
      { type: 'startTest', dogId: 'id-1', now: NOW, testId: 't1' },
      { type: 'finishTest', testId: 't1', now: LATER },
      { type: 'startTest', dogId: 'id-1', now: LATER, testId: 't2' },
    ])
    expect(s.tests).toHaveLength(2)
    expect(unfinishedTest(s, 'id-1')?.id).toBe('t2')
  })
})

describe('recordTask', () => {
  const started = () => run(withDogs(), [{ type: 'startTest', dogId: 'id-1', now: NOW, testId: 't1' }])

  it('overwrites a previous result for the same task', () => {
    const s = run(started(), [
      { type: 'recordTask', testId: 't1', taskId: 'detour', result: { status: 'skipped', reason: 'refused' } },
      { type: 'recordTask', testId: 't1', taskId: 'detour', result: { status: 'done', score: 2, outcome: 'slow' } },
    ])
    expect(s.tests[0].tasks).toEqual({ detour: { status: 'done', score: 2, outcome: 'slow' } })
  })

  it('ignores an unknown testId', () => {
    const s0 = started()
    expect(
      run(s0, [{ type: 'recordTask', testId: 'zz', taskId: 'detour', result: { status: 'done', score: 1 } }]),
    ).toBe(s0)
  })

  it('ignores recording on a finished test', () => {
    const s1 = run(started(), [{ type: 'finishTest', testId: 't1', now: LATER }])
    expect(
      run(s1, [{ type: 'recordTask', testId: 't1', taskId: 'detour', result: { status: 'done', score: 1 } }]),
    ).toBe(s1)
  })
})

describe('finishTest / setNote', () => {
  it('sets finishedAt once', () => {
    const s1 = run(withDogs(), [
      { type: 'startTest', dogId: 'id-1', now: NOW, testId: 't1' },
      { type: 'finishTest', testId: 't1', now: LATER },
    ])
    expect(s1.tests[0].finishedAt).toBe(LATER)
    expect(run(s1, [{ type: 'finishTest', testId: 't1', now: '2026-10-04T00:00:00.000Z' }])).toBe(s1)
  })

  it('sets and clears the note', () => {
    const s1 = run(withDogs(), [
      { type: 'startTest', dogId: 'id-1', now: NOW, testId: 't1' },
      { type: 'setNote', testId: 't1', note: 'жарко' },
    ])
    expect(s1.tests[0].note).toBe('жарко')
    const s2 = run(s1, [{ type: 'setNote', testId: 't1', note: '' }])
    expect('note' in s2.tests[0]).toBe(false)
  })
})

describe('deleteDog', () => {
  it('removes the dog and its tests only', () => {
    const s = run(withDogs(), [
      { type: 'startTest', dogId: 'id-1', now: NOW, testId: 't1' },
      { type: 'startTest', dogId: 'id-2', now: NOW, testId: 't2' },
      { type: 'deleteDog', dogId: 'id-1' },
    ])
    expect(s.dogs.map((d) => d.id)).toEqual(['id-2'])
    expect(s.tests.map((t) => t.id)).toEqual(['t2'])
  })
})

describe('replaceAll', () => {
  it('returns the given store', () => {
    const next = withDogs()
    expect(reducer(emptyStore(), { type: 'replaceAll', store: next })).toBe(next)
  })
})

describe('schema compatibility', () => {
  it('produces a store the schema accepts after a realistic sequence', () => {
    const s = run(emptyStore(), [
      { type: 'addDogs', dogs: [{ name: ' Рекс ', breed: '', birthMonth: '2020-05' }, { name: 'Бим' }], now: NOW },
      { type: 'updateDog', dogId: 'id-2', name: 'Бимка', breed: 'дворняга' },
      { type: 'startTest', dogId: 'id-1', now: NOW, testId: 't1' },
      { type: 'recordTask', testId: 't1', taskId: 'towel-find', result: { status: 'done', score: 3, trials: [true, true, true] } },
      { type: 'recordTask', testId: 't1', taskId: 'detour', result: { status: 'skipped', reason: 'stressed' } },
      { type: 'setNote', testId: 't1', note: 'заметка' },
      { type: 'finishTest', testId: 't1', now: LATER },
      { type: 'startTest', dogId: 'id-2', now: LATER, testId: 't2' },
      { type: 'deleteDog', dogId: 'id-2' },
    ])
    expect(storeSchema.safeParse(s).success).toBe(true)
  })
})
