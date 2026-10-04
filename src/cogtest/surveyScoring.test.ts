import { describe, expect, it } from 'vitest'
import { games } from '../content/games'
import { ageYears, isSeniorAge } from './format'
import { SURVEY_QUESTIONS } from './surveyQuestions'
import { previousSurvey, seniorGames, surveyTotal, surveyZone } from './surveyScoring'
import type { Survey, SurveyAnswer, SurveyQuestionId } from './types'

const ids = SURVEY_QUESTIONS.map((q) => q.id)

function answers(value: SurveyAnswer, overrides: Partial<Record<SurveyQuestionId, SurveyAnswer>> = {}) {
  const result = {} as Record<SurveyQuestionId, SurveyAnswer>
  for (const id of ids) result[id] = value
  return { ...result, ...overrides }
}

function survey(over: Partial<Survey>): Survey {
  return { id: 's', dogId: 'd', version: 1, startedAt: '2026-01-01T00:00:00.000Z', answers: {}, ...over }
}

describe('surveyTotal', () => {
  it('scores the minimum, maximum and middle', () => {
    expect(surveyTotal(answers(1))).toBe(16)
    expect(surveyTotal(answers(5))).toBe(80)
    expect(surveyTotal(answers(3))).toBe(48)
  })

  it('weights foodChange x2 and recognitionChange x3', () => {
    expect(surveyTotal(answers(1, { foodChange: 5 }))).toBe(24)
    expect(surveyTotal(answers(1, { recognitionChange: 5 }))).toBe(28)
  })

  it('is null unless all 13 are answered', () => {
    const partial = answers(1)
    delete (partial as Partial<typeof partial>).pacing
    expect(surveyTotal(partial)).toBeNull()
  })
})

describe('surveyZone', () => {
  it('splits at 40 and 50', () => {
    expect(surveyZone(39)).toBe('normal')
    expect(surveyZone(40)).toBe('risk')
    expect(surveyZone(49)).toBe('risk')
    expect(surveyZone(50)).toBe('signs')
  })
})

describe('SURVEY_QUESTIONS', () => {
  it('has 13 unique ids in spec order with the right weights', () => {
    expect(ids).toEqual([
      'pacing',
      'staring',
      'stuck',
      'recognition',
      'walls',
      'petting',
      'food',
      'pacingChange',
      'staringChange',
      'soilingChange',
      'foodChange',
      'recognitionChange',
      'activityChange',
    ])
    for (const q of SURVEY_QUESTIONS) {
      expect(q.weight).toBe(q.id === 'foodChange' ? 2 : q.id === 'recognitionChange' ? 3 : 1)
    }
  })

  it('keeps spec wording', () => {
    expect(SURVEY_QUESTIONS[0].text).toBe('Как часто собака ходит взад-вперёд, кругами или бесцельно бродит?')
    const activity = SURVEY_QUESTIONS.find((q) => q.id === 'activityChange')!
    expect(activity.options[0]).toMatch(/^Гораздо больше/)
  })
})

describe('previousSurvey', () => {
  const current = survey({ id: 'cur', startedAt: '2026-06-01T00:00:00.000Z' })
  const done = (over: Partial<Survey>) => survey({ finishedAt: '2026-02-01T00:00:00.000Z', ...over })

  it('picks the latest finished one and ignores the rest', () => {
    const list = [
      done({ id: 'old', startedAt: '2026-01-01T00:00:00.000Z' }),
      done({ id: 'newer', startedAt: '2026-03-01T00:00:00.000Z' }),
      survey({ id: 'unfinished', startedAt: '2026-04-01T00:00:00.000Z' }),
      done({ id: 'other-dog', dogId: 'x', startedAt: '2026-05-01T00:00:00.000Z' }),
      done({ id: 'other-version', version: 2, startedAt: '2026-05-02T00:00:00.000Z' }),
      done({ id: 'later', startedAt: '2026-07-01T00:00:00.000Z' }),
    ]
    expect(previousSurvey(list, current)?.id).toBe('newer')
    expect(previousSurvey([], current)).toBeUndefined()
  })
})

describe('seniorGames', () => {
  it('returns 3 senior games, scent first', () => {
    const picked = seniorGames(games)
    expect(picked).toHaveLength(3)
    for (const g of picked) expect(g.adaptations?.senior).toBeTruthy()
    expect(picked[0].types[0]).toBe('scent')
  })
})

describe('ageYears', () => {
  it('computes whole years', () => {
    expect(ageYears('2017-01', new Date('2026-10-04'))).toBe(9)
    expect(ageYears(undefined, new Date('2026-10-04'))).toBeUndefined()
    expect(ageYears('bad', new Date('2026-10-04'))).toBeUndefined()
  })

  it('flags seniors from 8', () => {
    expect(isSeniorAge(8)).toBe(true)
    expect(isSeniorAge(7)).toBe(false)
  })
})
