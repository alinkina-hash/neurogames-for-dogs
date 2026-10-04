import { Link } from 'react-router'
import { useCogStoreContext } from '../../cogtest/CogStoreContext'
import { ageText, ageYears, formatDate, formatDayMonth, isSeniorAge } from '../../cogtest/format'
import { unfinishedSurvey } from '../../cogtest/reducer'
import { SURVEY_SOURCE } from '../../cogtest/surveyQuestions'
import { previousSurvey, surveyTotal, surveyZone, ZONES } from '../../cogtest/surveyScoring'
import type { Dog, Survey } from '../../cogtest/types'
import StartSurveyButton from './StartSurveyButton'
import TrendChart from './TrendChart'

const MONTHS_AHEAD = 6

const BANDS = [
  { from: 16, to: 40, color: 'var(--ok-bg)' },
  { from: 40, to: 50, color: 'var(--warn-bg)' },
  { from: 50, to: 80, color: 'var(--danger-bg)' },
]

/** Total went up = worse (red), down = better (green). */
function SurveyChange({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="survey-up" aria-label={`хуже на ${delta}`}>
        ↑ +{delta}
      </span>
    )
  }
  if (delta < 0) {
    return (
      <span className="survey-down" aria-label={`лучше на ${-delta}`}>
        ↓ −{-delta}
      </span>
    )
  }
  return (
    <span className="survey-eq" aria-label="без изменений">
      =
    </span>
  )
}

function nextSurveyDate(startedAt: string): Date {
  const date = new Date(startedAt)
  date.setMonth(date.getMonth() + MONTHS_AHEAD)
  return date
}

interface Props {
  dog: Dog
  now: Date
}

/** Dog profile: what the behaviour survey is, how to start it, and the history of results. */
function SurveyCard({ dog, now }: Props) {
  const { store } = useCogStoreContext()
  const years = ageYears(dog.birthMonth, now)
  const senior = years !== undefined && isSeniorAge(years)

  const finished = store.surveys
    .filter((s) => s.dogId === dog.id && s.finishedAt)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
  const unfinished = unfinishedSurvey(store, dog.id)

  const points = [...finished].reverse().flatMap((s) => {
    const total = surveyTotal(s.answers)
    return total === null ? [] : [{ date: s.startedAt, value: total }]
  })

  const next = finished[0] ? nextSurveyDate(finished[0].startedAt) : undefined
  const showNext = next !== undefined && next.getTime() > now.getTime()

  function row(survey: Survey) {
    const total = surveyTotal(survey.answers)
    if (total === null) return null
    const before = previousSurvey(store.surveys, survey)
    const beforeTotal = before ? surveyTotal(before.answers) : null
    return (
      <li key={survey.id} className="block feed-item">
        <Link to={`/profile/survey-result/${survey.id}`} className="survey-row">
          <span className="survey-row-date">{formatDate(survey.startedAt)}</span>
          <span className="survey-row-total">
            {total} · {ZONES[surveyZone(total)].title}
            {beforeTotal !== null && (
              <>
                {' '}
                <SurveyChange delta={total - beforeTotal} />
              </>
            )}
          </span>
        </Link>
      </li>
    )
  }

  return (
    <>
      <section className="block survey-card">
        <h2>Анкета о поведении в старшем возрасте</h2>
        <p>
          13 вопросов о повседневном поведении собаки: как она ориентируется дома, узнаёт ли
          близких, как спит и гуляет.
        </p>
        <p>
          <b>Зачем:</b> с возрастом у собак может развиться когнитивная дисфункция — собачья
          «деменция». Её признаки часто принимают за обычную старость. Анкета помогает вовремя их
          заметить и показать собаку ветеринару.
        </p>
        <p>
          <b>Кому:</b> рекомендуется собакам с 8 лет, раз в полгода.
        </p>
        {senior && (
          <span className="survey-tag">
            {dog.name} {ageText(dog.birthMonth, now)} — рекомендуем
          </span>
        )}
        <p className="survey-note">Займёт около 5 минут. Это не диагноз.</p>
        <StartSurveyButton dogId={dog.id} />
        <p className="survey-source">
          Источник:{' '}
          <a href={SURVEY_SOURCE.url} target="_blank" rel="noreferrer">
            {SURVEY_SOURCE.title}
          </a>
        </p>
      </section>

      {(finished.length > 0 || unfinished) && (
        <section className="survey-history">
          <h2 className="dog-h2">Результаты анкеты</h2>
          {unfinished && (
            <div className="profile-warning feed-unfinished">
              <p>Анкета от {formatDayMonth(unfinished.startedAt)} не закончена</p>
              <Link to={`/profile/survey/${unfinished.id}`} className="button">
                Продолжить
              </Link>
            </div>
          )}
          {finished.length > 0 && (
            <div className="block">
              <TrendChart
                points={points}
                min={16}
                max={80}
                bands={BANDS}
                label="Итог анкеты, от 16 до 80"
              />
            </div>
          )}
          <ul className="survey-list">{finished.map(row)}</ul>
          {showNext && next && (
            <p className="dog-hint">
              Следующую анкету лучше заполнить после {formatDayMonth(next.toISOString())}
            </p>
          )}
        </section>
      )}
    </>
  )
}

export default SurveyCard
