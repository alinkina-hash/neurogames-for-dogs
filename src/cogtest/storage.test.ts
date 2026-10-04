import { describe, expect, it } from 'vitest'
import { PROTOCOL_VERSION } from './tasks'
import { STORAGE_KEY, emptyStore, exportStore, loadStore, makeId, parseImport, saveStore, storageChange } from './storage'
import type { Store } from './types'

function fakeStorage(initial?: string) {
  const data = new Map<string, string>()
  if (initial !== undefined) data.set(STORAGE_KEY, initial)
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}

const sample: Store = {
  version: 1,
  dogs: [
    { id: 'd1', name: 'Бобик', breed: 'Бигль', birthMonth: '2020-05', createdAt: '2026-01-01T10:00:00.000Z' },
    { id: 'd2', name: 'Рекс', createdAt: '2026-01-02T10:00:00.000Z' },
  ],
  tests: [
    {
      id: 't1',
      dogId: 'd1',
      protocolVersion: PROTOCOL_VERSION,
      startedAt: '2026-02-01T10:00:00.000Z',
      finishedAt: '2026-02-01T10:30:00.000Z',
      tasks: {
        'towel-find': { status: 'done', score: 3, seconds: 10, found: true },
        'which-hand': { status: 'done', score: 2, trials: [true, false, true] },
        detour: { status: 'done', score: 3, outcome: 'fast' },
        'leave-it': { status: 'skipped', reason: 'stressed' },
      },
      note: 'хорошо',
    },
  ],
}

function withTask(task: unknown): string {
  const raw = JSON.parse(JSON.stringify(sample))
  raw.tests[0].tasks['towel-find'] = task
  return JSON.stringify(raw)
}

describe('loadStore / saveStore', () => {
  it('round trips a store', () => {
    const storage = fakeStorage()
    expect(saveStore(storage, sample)).toBe(true)
    expect(loadStore(storage)).toEqual({ kind: 'ok', store: sample })
  })

  it('reports empty, unavailable and throwing storage', () => {
    expect(loadStore(fakeStorage())).toEqual({ kind: 'empty' })
    expect(loadStore(null)).toEqual({ kind: 'unavailable' })
    const throwing = {
      getItem: () => {
        throw new Error('denied')
      },
    }
    expect(loadStore(throwing)).toEqual({ kind: 'unavailable' })
  })

  it('reports corrupt data with the raw text', () => {
    expect(loadStore(fakeStorage('{bad'))).toEqual({ kind: 'corrupt', raw: '{bad' })
    const raw = withTask({ status: 'done', score: 7 })
    expect(loadStore(fakeStorage(raw))).toEqual({ kind: 'corrupt', raw })
  })

  it('returns false when saving fails', () => {
    const throwing = {
      setItem: () => {
        throw new Error('quota')
      },
    }
    expect(saveStore(throwing, sample)).toBe(false)
    expect(saveStore(null, sample)).toBe(false)
  })

  it('refuses to save an invalid store and leaves storage untouched', () => {
    const before = JSON.stringify(sample)
    const storage = fakeStorage(before)
    const invalid = JSON.parse(withTask({ status: 'done', score: 3, seconds: -2 })) as Store
    expect(saveStore(storage, invalid)).toBe(false)
    expect(storage.getItem(STORAGE_KEY)).toBe(before)
    const orphan: Store = { ...sample, dogs: [] }
    expect(saveStore(storage, orphan)).toBe(false)
    expect(storage.getItem(STORAGE_KEY)).toBe(before)
    expect(loadStore(storage)).toEqual({ kind: 'ok', store: sample })
  })
})

describe('storageChange', () => {
  it('ignores other keys', () => {
    expect(storageChange('something-else', JSON.stringify(sample))).toBeNull()
  })
  it('reads a new valid value as the store', () => {
    expect(storageChange(STORAGE_KEY, JSON.stringify(sample))).toEqual({ kind: 'ok', store: sample })
  })
  it('reports a corrupt new value with its raw text', () => {
    const raw = withTask({ status: 'done', score: 9 })
    expect(storageChange(STORAGE_KEY, raw)).toEqual({ kind: 'corrupt', raw })
    expect(storageChange(STORAGE_KEY, '{bad')).toEqual({ kind: 'corrupt', raw: '{bad' })
  })
  it('treats a removed value or cleared storage as empty', () => {
    expect(storageChange(STORAGE_KEY, null)).toEqual({ kind: 'empty' })
    expect(storageChange(null, null)).toEqual({ kind: 'empty' })
  })
})

describe('schema strictness', () => {
  it.each([
    ['unknown task id', (r: any) => (r.tests[0].tasks.nope = { status: 'skipped', reason: 'refused' })],
    ['bad skip reason', (r: any) => (r.tests[0].tasks['towel-find'] = { status: 'skipped', reason: 'x' })],
    ['bad birthMonth', (r: any) => (r.dogs[0].birthMonth = '2020-13')],
    ['non-UTC timestamp', (r: any) => (r.dogs[0].createdAt = '2026-01-01T10:00:00+03:00')],
    ['fractional score', (r: any) => (r.tests[0].tasks['towel-find'] = { status: 'done', score: 1.5 })],
    ['extra key', (r: any) => (r.extra = 1)],
    ['wrong version', (r: any) => (r.version = 2)],
  ])('rejects %s', (_name, mutate) => {
    const raw = JSON.parse(JSON.stringify(sample))
    mutate(raw)
    expect(parseImport(JSON.stringify(raw))).toEqual({ ok: false, error: 'invalid' })
  })

  it('emptyStore is valid', () => {
    expect(parseImport(exportStore(emptyStore()))).toEqual({ ok: true, store: emptyStore() })
  })
})

describe('export / import', () => {
  it('rejects non-JSON text', () => {
    expect(parseImport('nope')).toEqual({ ok: false, error: 'not-json' })
  })

  it('rejects a test whose dog does not exist', () => {
    const raw = JSON.parse(JSON.stringify(sample))
    raw.tests[0].dogId = 'ghost'
    expect(parseImport(JSON.stringify(raw))).toEqual({ ok: false, error: 'invalid' })
  })

  it('round trips through export', () => {
    expect(parseImport(exportStore(sample))).toEqual({ ok: true, store: sample })
  })
})

describe('makeId', () => {
  it('returns distinct non-empty ids', () => {
    const a = makeId()
    const b = makeId()
    expect(a).not.toBe('')
    expect(b).not.toBe('')
    expect(a).not.toBe(b)
  })
})
