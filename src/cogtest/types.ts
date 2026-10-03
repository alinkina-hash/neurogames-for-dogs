import type { GameType } from '../content/schema'

export type TaskId =
  | 'towel-find'
  | 'which-hand'
  | 'delayed-search'
  | 'distraction-search'
  | 'detour'
  | 'empty-cup'
  | 'leave-it'
  | 'bowl-wait'

export type DetourOutcome = 'fast' | 'slow' | 'barges' | 'gave-up'

export type SkipReason = 'refused' | 'not-possible' | 'stressed'

export const SKIP_REASON_LABELS: Record<SkipReason, string> = {
  refused: 'собака отказалась',
  'not-possible': 'нет возможности',
  stressed: 'собака нервничает',
}

export type TaskResult =
  | {
      status: 'done'
      score: 0 | 1 | 2 | 3
      trials?: boolean[]
      seconds?: number
      found?: boolean
      outcome?: DetourOutcome
    }
  | { status: 'skipped'; reason: SkipReason }

/** What the owner records for a task, before it is turned into a score. */
export type RawResult =
  | { trials: boolean[] }
  | { seconds: number; found?: boolean }
  | { outcome: DetourOutcome }

export interface TestTask {
  id: TaskId
  skill: GameType
  title: string
  goal: string
  equipment: string[]
  steps: string[]
  kind: 'trials' | 'timer' | 'outcome'
  trialCount?: 3
  timerLimitSeconds?: number
  scoring: string[]
  relatedGameId?: string
  sources: { title: string; url: string }[]
}

export interface TestSummary {
  skills: Record<GameType, { score: number; max: 3 | 6; complete: boolean; done: number }>
  total: number | null
  strongest: GameType[]
  weakest: GameType[]
}

export interface CogTest {
  id: string
  dogId: string
  protocolVersion: number
  startedAt: string
  finishedAt?: string
  tasks: Partial<Record<TaskId, TaskResult>>
  note?: string
}
