import type { SurveyQuestionId } from './types'

export interface SurveyQuestion {
  id: SurveyQuestionId
  text: string
  hint?: string
  options: readonly [string, string, string, string, string]
  weight: 1 | 2 | 3
}

export const SURVEY_VERSION = 1

export const CHANGE_INTRO = 'Дальше сравните с тем, что было полгода назад'

export const SURVEY_SOURCE = {
  title: 'Salvin et al., 2011 — шкала CCDR',
  url: 'https://doi.org/10.1016/j.tvjl.2010.05.014',
}

export const TRANSLATION_NOTE =
  'Анкета — перевод шкалы CCDR. Перевод научно не проверялся; итог — ориентир, а не диагноз.'

const FREQUENCY = ['Никогда', 'Раз в месяц', 'Раз в неделю', 'Раз в день', 'Чаще раза в день'] as const

const SHARE = [
  'Никогда',
  'Иногда — до 30% случаев',
  'Примерно в половине случаев — 31–60%',
  'Часто — 61–99% случаев',
  'Всегда',
] as const

const CHANGE = ['Гораздо реже', 'Немного реже', 'Так же', 'Немного чаще', 'Гораздо чаще'] as const

const ACTIVITY = ['Гораздо больше', 'Немного больше', 'Столько же', 'Немного меньше', 'Гораздо меньше'] as const

const AGO = 'По сравнению с тем, что было полгода назад, '

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'pacing',
    text: 'Как часто собака ходит взад-вперёд, кругами или бесцельно бродит?',
    options: FREQUENCY,
    weight: 1,
  },
  {
    id: 'staring',
    text: 'Как часто собака смотрит в одну точку на стене или на полу?',
    options: FREQUENCY,
    weight: 1,
  },
  {
    id: 'stuck',
    text: 'Как часто собака застревает за предметами и не может их обойти?',
    options: FREQUENCY,
    weight: 1,
  },
  {
    id: 'recognition',
    text: 'Как часто собака не узнаёт знакомых людей или животных?',
    options: FREQUENCY,
    weight: 1,
  },
  {
    id: 'walls',
    text: 'Как часто собака натыкается на стены или двери?',
    options: FREQUENCY,
    weight: 1,
  },
  {
    id: 'petting',
    text: 'Как часто собака уходит или уворачивается, когда её гладят?',
    options: FREQUENCY,
    weight: 1,
  },
  {
    id: 'food',
    text: 'Как часто собаке трудно найти еду, упавшую на пол?',
    options: SHARE,
    weight: 1,
  },
  {
    id: 'pacingChange',
    text: `${AGO}собака теперь ходит взад-вперёд, кругами или бесцельно бродит…`,
    options: CHANGE,
    weight: 1,
  },
  {
    id: 'staringChange',
    text: `${AGO}собака теперь смотрит в одну точку на стене или на полу…`,
    options: CHANGE,
    weight: 1,
  },
  {
    id: 'soilingChange',
    text: `${AGO}собака теперь делает дела дома там, где раньше было чисто…`,
    hint: 'Если собака никогда не пачкала дома, выберите „Так же“',
    options: CHANGE,
    weight: 1,
  },
  {
    id: 'foodChange',
    text: `${AGO}собаке теперь бывает трудно найти упавшую на пол еду…`,
    options: CHANGE,
    weight: 2,
  },
  {
    id: 'recognitionChange',
    text: `${AGO}собака теперь не узнаёт знакомых людей или животных…`,
    options: CHANGE,
    weight: 3,
  },
  {
    id: 'activityChange',
    text: `${AGO}сколько времени собака теперь проводит активно?`,
    options: ACTIVITY,
    weight: 1,
  },
]
