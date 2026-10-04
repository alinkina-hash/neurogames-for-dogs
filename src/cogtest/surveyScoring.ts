import type { Game } from '../content/schema'
import { GAME_TYPES } from '../content/schema'
import { SURVEY_QUESTIONS } from './surveyQuestions'
import type { Survey, SurveyQuestionId, SurveyAnswer } from './types'

export type SurveyZone = 'normal' | 'risk' | 'signs'

export const ZONES: Record<SurveyZone, { title: string; advice: string }> = {
  normal: {
    title: 'Норма',
    advice: 'Признаков возрастных изменений почти нет. Заполните анкету снова через полгода.',
  },
  risk: {
    title: 'Группа риска',
    advice:
      'Есть изменения, за которыми стоит понаблюдать. Расскажите о них ветеринару при следующем визите и заполните анкету снова через 2–3 месяца.',
  },
  signs: {
    title: 'Есть признаки когнитивной дисфункции',
    advice: 'Покажите собаку ветеринару: изменения в поведении стоит обсудить со специалистом.',
  },
}

export const VET_NOTE =
  'Похожие изменения бывают не только из-за возраста, но и при боли, потере слуха или зрения, болезнях щитовидной железы. Только ветеринар может поставить диагноз.'

/** Weighted sum (16–80); null unless all 13 questions are answered. */
export function surveyTotal(answers: Partial<Record<SurveyQuestionId, SurveyAnswer>>): number | null {
  let total = 0
  for (const q of SURVEY_QUESTIONS) {
    const answer = answers[q.id]
    if (answer === undefined) return null
    total += answer * q.weight
  }
  return total
}

export function surveyZone(total: number): SurveyZone {
  if (total >= 50) return 'signs'
  if (total >= 40) return 'risk'
  return 'normal'
}

/** Latest finished survey of the same dog and version that started before `current`. */
export function previousSurvey(surveys: Survey[], current: Survey): Survey | undefined {
  return surveys
    .filter(
      (s) =>
        s.finishedAt !== undefined &&
        s.dogId === current.dogId &&
        s.version === current.version &&
        s.startedAt < current.startedAt,
    )
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0]
}

/** Games with a senior tip: scent first, then by type order, difficulty and title. */
export function seniorGames(games: Game[], count = 3): Game[] {
  const typeRank = (g: Game) => GAME_TYPES.indexOf(g.types[0])
  return games
    .filter((g) => g.adaptations?.senior)
    .sort(
      (a, b) =>
        Number(b.types[0] === 'scent') - Number(a.types[0] === 'scent') ||
        typeRank(a) - typeRank(b) ||
        a.difficulty - b.difficulty ||
        a.title.localeCompare(b.title, 'ru'),
    )
    .slice(0, count)
}
