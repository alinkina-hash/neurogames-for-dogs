import { z } from 'zod'

export const GAME_TYPES = ['scent', 'memory', 'thinking', 'self-control'] as const

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  scent: 'Нюх и поиск',
  memory: 'Память',
  thinking: 'Мышление',
  'self-control': 'Самоконтроль',
}

export const GAME_TYPE_TAGLINES: Record<GameType, string> = {
  scent: 'Найти носом то, чего не видно глазами',
  memory: 'Запомнить, где спрятано, и не забыть',
  thinking: 'Догадаться, как добраться до лакомства',
  'self-control': 'Дождаться разрешения, даже когда очень хочется',
}

export const DIFFICULTIES = [1, 2, 3, 4, 5] as const

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  1: 'Очень легко',
  2: 'Легко',
  3: 'Средне',
  4: 'Сложно',
  5: 'Очень сложно',
}

const text = z.string().trim().min(1)

const mediaSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('youtube'), url: z.url(), title: text }),
  z.strictObject({ kind: z.literal('photo'), url: z.url(), author: text, license: text }),
])

const difficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
const sourcesSchema = z.array(z.strictObject({ title: text, url: z.url() })).min(1)

/** Another way to play the same game; every variation must show a demo and cite a source. */
const variationSchema = z.strictObject({
  title: text,
  difficulty: difficultySchema.optional(),
  description: text,
  steps: z.array(text).min(1),
  media: z.array(mediaSchema).min(1),
  sources: sourcesSchema,
})
const levelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

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
    .array(z.strictObject({ level: levelSchema, description: text }))
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
  variations: z.array(variationSchema).optional(),
  sources: sourcesSchema,
})

export type GameType = (typeof GAME_TYPES)[number]
export type Difficulty = (typeof DIFFICULTIES)[number]
export type Game = z.infer<typeof gameSchema>
export type GameMedia = NonNullable<Game['media']>[number]
export type GameVariation = NonNullable<Game['variations']>[number]
