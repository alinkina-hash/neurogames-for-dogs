import { Link, Navigate, useParams } from 'react-router'
import SurveyChange from '../../components/cogtest/SurveyChange'
import { SURVEY_BANDS } from '../../components/cogtest/surveyBands'
import SurveyNotFound from '../../components/cogtest/SurveyNotFound'
import { useCogStoreContext } from '../../cogtest/CogStoreContext'
import { formatDate } from '../../cogtest/format'
import { SURVEY_QUESTIONS, SURVEY_SOURCE, TRANSLATION_NOTE } from '../../cogtest/surveyQuestions'
import { previousSurvey, seniorGames, SURVEY_MAX, SURVEY_MIN, surveyTotal, surveyZone, VET_NOTE, ZONES } from '../../cogtest/surveyScoring'
import { games } from '../../content/games'

const MIN = SURVEY_MIN
const MAX = SURVEY_MAX
const TICKS = [16, 40, 50, 80]

const percent = (value: number) => ((value - MIN) / (MAX - MIN)) * 100

function SurveyResultPage() {
  const { surveyId } = useParams()
  const { store } = useCogStoreContext()
  const survey = store.surveys.find((s) => s.id === surveyId)
  const dog = survey && store.dogs.find((d) => d.id === survey.dogId)
  if (!survey || !dog) return <SurveyNotFound />
  if (!survey.finishedAt) return <Navigate replace to={`/profile/survey/${survey.id}`} />

  const total = surveyTotal(survey.answers)
  if (total === null) return <Navigate replace to={`/profile/survey/${survey.id}`} />

  const zone = surveyZone(total)
  const before = previousSurvey(store.surveys, survey)
  const beforeTotal = before ? surveyTotal(before.answers) : null
  const beforeZone = beforeTotal === null ? undefined : surveyZone(beforeTotal)
  const support = seniorGames(games)

  return (
    <div className="result-page survey-result">
      <header className="result-head">
        <p className="test-dog">{dog.name}</p>
        <h1>Результат анкеты</h1>
        <p className="result-date">{formatDate(survey.startedAt)}</p>
      </header>

      <section className="block survey-score" data-zone={zone}>
        <div className="survey-score-head">
          <b className="survey-score-total">{total} из {SURVEY_MAX}</b>
          {beforeTotal !== null && (
            <span className="survey-score-delta">
              <SurveyChange delta={total - beforeTotal} /> к прошлой
            </span>
          )}
        </div>
        <div
          className="survey-zone"
          role="img"
          aria-label={`Итог ${total} из ${SURVEY_MAX}, зона ${ZONES[zone].title}`}
        >
          {SURVEY_BANDS.map((band) => (
            <i
              key={band.from}
              style={{ width: `${percent(band.to) - percent(band.from)}%`, background: band.color }}
            />
          ))}
          <span className="survey-zone-marker" style={{ left: `${percent(total)}%` }} />
        </div>
        <div className="survey-zone-ticks" aria-hidden="true">
          {TICKS.map((tick) => (
            <span key={tick} data-tick={tick} style={{ left: `${percent(tick)}%` }}>
              {tick}
            </span>
          ))}
        </div>
        <h2 className="survey-zone-title">{ZONES[zone].title}</h2>
        <p>{ZONES[zone].advice}</p>
        {before && beforeZone && beforeZone !== zone && (
          <p className="survey-zone-change">
            Было: {ZONES[beforeZone].title} → стало: {ZONES[zone].title}
          </p>
        )}
        {before && (
          <p className="result-compare-note">Сравнение с анкетой от {formatDate(before.startedAt)}.</p>
        )}
      </section>

      <section className="block survey-vet">
        <p>{VET_NOTE}</p>
      </section>

      {support.length > 0 && (
        <section className="block survey-support">
          <h2>Что поддержит голову</h2>
          <ul>
            {support.map((game) => (
              <li key={game.id}>
                <Link to={`/games/${game.id}`}>
                  <span>{game.title}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="block">
        <details className="survey-answers">
          <summary>Ответы на вопросы</summary>
          <ol>
            {SURVEY_QUESTIONS.map((q) => {
              const value = survey.answers[q.id]
              if (value === undefined) return null
              return (
                <li key={q.id}>
                  <span className="survey-answers-q">{q.text}</span>
                  <span className="survey-answers-a">{q.options[value - 1]}</span>
                  <span className="survey-answers-p">
                    {q.weight === 1 ? `${value} б.` : `${value} × ${q.weight} = ${value * q.weight} б.`}
                  </span>
                </li>
              )
            })}
          </ol>
        </details>
      </section>

      <p className="survey-translation">
        {TRANSLATION_NOTE}{' '}
        <a href={SURVEY_SOURCE.url} target="_blank" rel="noreferrer">
          {SURVEY_SOURCE.title}
        </a>
      </p>

      <p>
        <Link to={`/profile/dog/${dog.id}`} className="button">
          Профиль собаки
        </Link>
      </p>
    </div>
  )
}

export default SurveyResultPage
