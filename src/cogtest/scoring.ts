import type { GameType } from '../content/schema'
import { GAME_TYPES } from '../content/schema'
import { TEST_TASKS } from './tasks'
import type { RawResult, TaskId, TaskResult, TestSummary } from './types'

type Score = 0 | 1 | 2 | 3

function byThresholds(seconds: number, three: number, two: number, one: number): Score {
  const s = Math.floor(seconds)
  if (s >= three) return 3
  if (s >= two) return 2
  if (s >= one) return 1
  return 0
}

export function scoreTask(id: TaskId, raw: RawResult): Score {
  if ('trials' in raw) return Math.min(3, raw.trials.filter(Boolean).length) as Score
  if ('outcome' in raw) {
    return { fast: 3, slow: 2, barges: 1, 'gave-up': 0 }[raw.outcome] as Score
  }
  const seconds = Math.floor(raw.seconds)
  switch (id) {
    case 'towel-find':
      if (raw.found === false) return 0
      return seconds <= 15 ? 3 : seconds <= 60 ? 2 : 1
    case 'leave-it':
      return byThresholds(seconds, 60, 15, 3)
    case 'bowl-wait':
      return byThresholds(seconds, 15, 5, 1)
    default:
      throw new Error(`Task ${id} does not use a timer`)
  }
}

/** Skill = sum of its two tasks; a skipped task makes the skill incomplete. */
export function summarizeTest(results: Partial<Record<TaskId, TaskResult>>): TestSummary {
  const skills = {} as TestSummary['skills']
  for (const skill of GAME_TYPES) {
    let score = 0
    let done = 0
    for (const task of TEST_TASKS.filter((t) => t.skill === skill)) {
      const result = results[task.id]
      if (result?.status === 'done') {
        score += result.score
        done += 1
      }
    }
    skills[skill] = { score, max: done === 2 ? 6 : 3, complete: done === 2, done }
  }

  const complete = GAME_TYPES.filter((skill) => skills[skill].complete)
  const allDone = GAME_TYPES.every((skill) => skills[skill].complete)
  const total = allDone ? GAME_TYPES.reduce((sum, skill) => sum + skills[skill].score, 0) : null

  let strongest: GameType[] = []
  let weakest: GameType[] = []
  if (complete.length >= 2) {
    const scores = complete.map((skill) => skills[skill].score)
    const high = Math.max(...scores)
    const low = Math.min(...scores)
    strongest = complete.filter((skill) => skills[skill].score === high)
    weakest = complete.filter((skill) => skills[skill].score === low)
  }

  return { skills, total, strongest, weakest }
}
