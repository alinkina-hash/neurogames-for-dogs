import type { GameType } from '../content/schema'
import { GAME_TYPES } from '../content/schema'
import { summarizeTest } from './scoring'
import { TEST_TASKS } from './tasks'
import type { CogTest, TaskId } from './types'

interface Delta {
  now: number
  before: number
  delta: number
}

export interface Comparison {
  tasks: Partial<Record<TaskId, Delta>>
  skills: Partial<Record<GameType, Delta>>
}

/** Latest finished test of the same dog and protocol that started before `current`. */
export function previousTest(tests: CogTest[], current: CogTest): CogTest | undefined {
  return tests
    .filter(
      (t) =>
        t.finishedAt !== undefined &&
        t.dogId === current.dogId &&
        t.protocolVersion === current.protocolVersion &&
        t.startedAt < current.startedAt,
    )
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0]
}

export function compareTests(current: CogTest, previous: CogTest): Comparison {
  const tasks: Comparison['tasks'] = {}
  for (const { id } of TEST_TASKS) {
    const now = current.tasks[id]
    const before = previous.tasks[id]
    if (now?.status === 'done' && before?.status === 'done') {
      tasks[id] = { now: now.score, before: before.score, delta: now.score - before.score }
    }
  }

  const nowSummary = summarizeTest(current.tasks)
  const beforeSummary = summarizeTest(previous.tasks)
  const skills: Comparison['skills'] = {}
  for (const skill of GAME_TYPES) {
    const now = nowSummary.skills[skill]
    const before = beforeSummary.skills[skill]
    if (now.complete && before.complete) {
      skills[skill] = { now: now.score, before: before.score, delta: now.score - before.score }
    }
  }

  return { tasks, skills }
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000)
}
