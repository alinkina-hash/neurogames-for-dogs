import { z } from 'zod'
import type { Store, TaskId } from './types'

export const STORAGE_KEY = 'neurogames:v1'

const TASK_IDS = [
  'towel-find',
  'which-hand',
  'delayed-search',
  'distraction-search',
  'detour',
  'empty-cup',
  'leave-it',
  'bowl-wait',
] as const satisfies readonly TaskId[]

// Compile-time guard: fails if a TaskId is missing from TASK_IDS.
const _allTaskIds: TaskId extends (typeof TASK_IDS)[number] ? true : never = true
void _allTaskIds

export const BIRTH_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

const timestamp = z.iso.datetime()
const text = z.string().trim().min(1)

const taskResultSchema = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('done'),
    score: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    trials: z.array(z.boolean()).optional(),
    seconds: z.number().min(0).optional(),
    found: z.boolean().optional(),
    outcome: z.enum(['fast', 'slow', 'barges', 'gave-up']).optional(),
  }),
  z.strictObject({
    status: z.literal('skipped'),
    reason: z.enum(['refused', 'not-possible', 'stressed']),
  }),
])

const dogSchema = z.strictObject({
  id: text,
  name: text,
  breed: z.string().optional(),
  birthMonth: z.string().regex(BIRTH_MONTH_RE).optional(),
  createdAt: timestamp,
})

const testSchema = z.strictObject({
  id: text,
  dogId: text,
  protocolVersion: z.number().int().positive(),
  startedAt: timestamp,
  finishedAt: timestamp.optional(),
  tasks: z.partialRecord(z.enum(TASK_IDS), taskResultSchema),
  note: z.string().optional(),
})

export const storeSchema = z
  .strictObject({
    version: z.literal(1),
    dogs: z.array(dogSchema),
    tests: z.array(testSchema),
  })
  .superRefine((store, ctx) => {
    const dogIds = new Set(store.dogs.map((dog) => dog.id))
    store.tests.forEach((test, index) => {
      if (!dogIds.has(test.dogId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['tests', index, 'dogId'],
          message: `unknown dog ${test.dogId}`,
        })
      }
    })
  }) satisfies z.ZodType<Store>

export function emptyStore(): Store {
  return { version: 1, dogs: [], tests: [] }
}

export type LoadResult =
  | { kind: 'ok'; store: Store }
  | { kind: 'empty' }
  | { kind: 'corrupt'; raw: string }
  | { kind: 'unavailable' }

export function loadStore(storage: Pick<Storage, 'getItem'> | null): LoadResult {
  if (!storage) return { kind: 'unavailable' }
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { kind: 'unavailable' }
  }
  if (raw === null) return { kind: 'empty' }
  const result = parseImport(raw)
  return result.ok ? { kind: 'ok', store: result.store } : { kind: 'corrupt', raw }
}

/** Writes the store; refuses (false) an invalid one so storage never holds data that cannot be loaded. */
export function saveStore(storage: Pick<Storage, 'setItem'> | null, store: Store): boolean {
  if (!storage) return false
  if (!storeSchema.safeParse(store).success) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store))
    return true
  } catch {
    return false
  }
}

export function exportStore(store: Store): string {
  return JSON.stringify(store, null, 2)
}

export function parseImport(
  text: string,
): { ok: true; store: Store } | { ok: false; error: 'not-json' | 'invalid' } {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: 'not-json' }
  }
  const parsed = storeSchema.safeParse(json)
  return parsed.success ? { ok: true, store: parsed.data } : { ok: false, error: 'invalid' }
}

export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
