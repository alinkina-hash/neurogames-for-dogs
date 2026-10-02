import { z } from 'zod'

export const GAME_TYPES = ['scent', 'memory', 'thinking', 'self-control'] as const

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  scent: 'Нюх и поиск',
  memory: 'Память',
  thinking: 'Мышление',
  'self-control': 'Самоконтроль',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Лёгкая',
  2: 'Средняя',
  3: 'Сложная',
}

const text = z.string().trim().min(1)

const mediaSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('youtube'), url: z.url(), title: text }),
  z.strictObject({ kind: z.literal('photo'), url: z.url(), author: text, license: text }),
])

const difficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

export const gameSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: text,
  types: z.array(z.enum(GAME_TYPES)).min(1),
  goal: text,
  difficulty: difficultySchema,
  equipment: z.array(text),
  prepMinutes: z.number().int().min(0),
  sessionMinutes: z
    .strictObject({ min: z.number().int().positive(), max: z.number().int().positive() })
    .refine((v) => v.min <= v.max, 'min must not exceed max'),
  media: z.array(mediaSchema).optional(),
  steps: z.array(text).min(1),
  levels: z
    .array(z.strictObject({ level: difficultySchema, description: text }))
    .length(3)
    .refine((levels) => levels.every((l, i) => l.level === i + 1), 'levels must go 1, 2, 3'),
  stopSignals: z.array(text).min(1),
  safety: z.array(text).min(1),
  adaptations: z
    .strictObject({
      puppy: text.optional(),
      senior: text.optional(),
      small: text.optional(),
      large: text.optional(),
    })
    .optional(),
  sources: z.array(z.strictObject({ title: text, url: z.url() })).min(1),
})

export type GameType = (typeof GAME_TYPES)[number]
export type Difficulty = 1 | 2 | 3
export type Game = z.infer<typeof gameSchema>
export type GameMedia = NonNullable<Game['media']>[number]
