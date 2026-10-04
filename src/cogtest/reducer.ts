import { PROTOCOL_VERSION } from './tasks'
import { BIRTH_MONTH_RE, makeId } from './storage'
import { SURVEY_QUESTIONS, SURVEY_VERSION } from './surveyQuestions'
import type { CogTest, Dog, Store, Survey, SurveyAnswer, SurveyQuestionId, TaskId, TaskResult } from './types'

export interface DogInput {
  name: string
  breed?: string
  birthMonth?: string
}

export type Action =
  | { type: 'addDogs'; dogs: DogInput[]; now: string }
  | ({ type: 'updateDog'; dogId: string } & DogInput)
  | { type: 'deleteDog'; dogId: string }
  | { type: 'startTest'; dogId: string; now: string; testId: string }
  | { type: 'recordTask'; testId: string; taskId: TaskId; result: TaskResult }
  | { type: 'finishTest'; testId: string; now: string }
  | { type: 'setNote'; testId: string; note: string }
  | { type: 'startSurvey'; dogId: string; now: string; surveyId: string }
  | { type: 'answerSurvey'; surveyId: string; questionId: SurveyQuestionId; value: SurveyAnswer; now: string }
  | { type: 'replaceAll'; store: Store }

export function unfinishedTest(store: Store, dogId: string): CogTest | undefined {
  return store.tests.find((test) => test.dogId === dogId && !test.finishedAt)
}

/** Latest finished test of the dog by start time. */
export function latestFinished(store: Store, dogId: string): CogTest | undefined {
  return store.tests
    .filter((test) => test.dogId === dogId && test.finishedAt)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0]
}

export function unfinishedSurvey(store: Store, dogId: string): Survey | undefined {
  return store.surveys.find((survey) => survey.dogId === dogId && !survey.finishedAt)
}

/** Latest finished survey of the dog by start time. */
export function latestFinishedSurvey(store: Store, dogId: string): Survey | undefined {
  return store.surveys
    .filter((survey) => survey.dogId === dogId && survey.finishedAt)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))[0]
}

/** Trims fields and drops empty optional ones; null when the name is empty. */
function cleanDog(input: DogInput): Pick<Dog, 'name' | 'breed' | 'birthMonth'> | null {
  const name = input.name.trim()
  if (!name) return null
  const breed = input.breed?.trim()
  const trimmedMonth = input.birthMonth?.trim()
  const birthMonth = trimmedMonth && BIRTH_MONTH_RE.test(trimmedMonth) ? trimmedMonth : undefined
  return {
    name,
    ...(breed ? { breed } : {}),
    ...(birthMonth ? { birthMonth } : {}),
  }
}

function mapTest(store: Store, testId: string, fn: (test: CogTest) => CogTest | null): Store {
  const index = store.tests.findIndex((test) => test.id === testId)
  if (index === -1) return store
  const next = fn(store.tests[index])
  if (!next) return store
  const tests = store.tests.slice()
  tests[index] = next
  return { ...store, tests }
}

export function reducer(store: Store, action: Action, ids: () => string = makeId): Store {
  switch (action.type) {
    case 'addDogs': {
      const cleaned = action.dogs.map(cleanDog)
      if (cleaned.some((dog) => dog === null)) return store
      const added = cleaned.map((dog) => ({ id: ids(), ...dog!, createdAt: action.now }))
      return added.length === 0 ? store : { ...store, dogs: [...store.dogs, ...added] }
    }
    case 'updateDog': {
      const index = store.dogs.findIndex((dog) => dog.id === action.dogId)
      const cleaned = cleanDog(action)
      if (index === -1 || !cleaned) return store
      const dogs = store.dogs.slice()
      dogs[index] = { id: dogs[index].id, ...cleaned, createdAt: dogs[index].createdAt }
      return { ...store, dogs }
    }
    case 'deleteDog':
      return {
        ...store,
        dogs: store.dogs.filter((dog) => dog.id !== action.dogId),
        tests: store.tests.filter((test) => test.dogId !== action.dogId),
        surveys: store.surveys.filter((survey) => survey.dogId !== action.dogId),
      }
    case 'startTest': {
      if (!store.dogs.some((dog) => dog.id === action.dogId)) return store
      if (unfinishedTest(store, action.dogId)) return store
      const test: CogTest = {
        id: action.testId,
        dogId: action.dogId,
        protocolVersion: PROTOCOL_VERSION,
        startedAt: action.now,
        tasks: {},
      }
      return { ...store, tests: [...store.tests, test] }
    }
    case 'recordTask':
      return mapTest(store, action.testId, (test) =>
        test.finishedAt ? null : { ...test, tasks: { ...test.tasks, [action.taskId]: action.result } },
      )
    case 'finishTest':
      return mapTest(store, action.testId, (test) =>
        test.finishedAt ? null : { ...test, finishedAt: action.now },
      )
    case 'setNote':
      return mapTest(store, action.testId, (test) => {
        const { note: _old, ...rest } = test
        void _old
        return action.note ? { ...rest, note: action.note } : rest
      })
    case 'startSurvey': {
      if (!store.dogs.some((dog) => dog.id === action.dogId)) return store
      if (unfinishedSurvey(store, action.dogId)) return store
      const survey: Survey = {
        id: action.surveyId,
        dogId: action.dogId,
        version: SURVEY_VERSION,
        startedAt: action.now,
        answers: {},
      }
      return { ...store, surveys: [...store.surveys, survey] }
    }
    case 'answerSurvey': {
      const index = store.surveys.findIndex((survey) => survey.id === action.surveyId)
      if (index === -1 || store.surveys[index].finishedAt) return store
      const survey = store.surveys[index]
      const answers = { ...survey.answers, [action.questionId]: action.value }
      const complete = Object.keys(answers).length === SURVEY_QUESTIONS.length
      const surveys = store.surveys.slice()
      surveys[index] = { ...survey, answers, ...(complete ? { finishedAt: action.now } : {}) }
      return { ...store, surveys }
    }
    case 'replaceAll':
      return action.store
  }
}
