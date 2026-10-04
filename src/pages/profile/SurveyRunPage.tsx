import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useCogStoreContext } from '../../cogtest/CogStoreContext'
import { CHANGE_INTRO, SURVEY_QUESTIONS } from '../../cogtest/surveyQuestions'
import type { SurveyAnswer } from '../../cogtest/types'

const TAP_GUARD_MS = 400
const CHANGE_FROM_ID = 'pacingChange'

function NotFound() {
  return (
    <div className="block test-run">
      <h1>Анкета не найдена</h1>
      <p>
        <a href="#/profile">← К профилям</a>
      </p>
    </div>
  )
}

function SurveyRunPage() {
  const { surveyId } = useParams()
  const { store, dispatch } = useCogStoreContext()
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [viewing, setViewing] = useState<number | null>(null)
  const shownAt = useRef(0)

  const survey = store.surveys.find((s) => s.id === surveyId)
  const answeredCount = survey ? SURVEY_QUESTIONS.filter((q) => survey.answers[q.id]).length : 0
  const showIntro = answeredCount === 0 && !started
  const firstOpen = survey ? SURVEY_QUESTIONS.findIndex((q) => !survey.answers[q.id]) : -1
  const index = viewing ?? (firstOpen === -1 ? SURVEY_QUESTIONS.length - 1 : firstOpen)

  useEffect(() => {
    shownAt.current = performance.now()
    window.scrollTo(0, 0)
  }, [index, showIntro])

  if (!survey) return <NotFound />
  if (survey.finishedAt) return <Navigate to={`/profile/survey-result/${survey.id}`} replace />

  const dogName = store.dogs.find((d) => d.id === survey.dogId)?.name ?? ''

  if (showIntro) {
    return (
      <div className="test-run">
        <p className="test-dog">Анкета для: {dogName}</p>
        <section className="block">
          <h1>Анкета о поведении</h1>
          <p>
            13 вопросов о повседневном поведении собаки: как она ориентируется дома, узнаёт ли
            близких, как спит и гуляет. Займёт около 5 минут.
          </p>
          <p>Отвечайте о поведении за последнее время.</p>
          <p className="test-disclaimer">Это не диагноз. Анкета только помогает заметить изменения.</p>
          <button type="button" className="button test-next" onClick={() => setStarted(true)}>
            Начать
          </button>
        </section>
      </div>
    )
  }

  const question = SURVEY_QUESTIONS[index]
  const current = survey.answers[question.id]
  const total = SURVEY_QUESTIONS.length

  function answer(value: SurveyAnswer) {
    if (performance.now() - shownAt.current < TAP_GUARD_MS) return
    shownAt.current = performance.now()
    dispatch({
      type: 'answerSurvey',
      surveyId: survey!.id,
      questionId: question.id,
      value,
      now: new Date().toISOString(),
    })
    const completes = answeredCount + (current ? 0 : 1) === total
    if (completes) {
      navigate(`/profile/survey-result/${survey!.id}`, { replace: true })
    } else {
      setViewing(index + 1 < total ? index + 1 : null)
    }
  }

  return (
    <div className="test-run">
      <section className="block survey-run">
        <p className="test-progress">
          Анкета для {dogName} · вопрос {index + 1} из {total}
        </p>
        <div
          className="survey-bar"
          role="progressbar"
          aria-label="Прогресс анкеты"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          <i style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        {question.id === CHANGE_FROM_ID && <p className="survey-change-intro">{CHANGE_INTRO}</p>}
        <h1 className="survey-question">{question.text}</h1>
        {question.hint && <p className="survey-hint">{question.hint}</p>}
        <div className="survey-options" role="group" aria-label="Ответ">
          {question.options.map((label, i) => (
            <button
              key={label}
              type="button"
              className="survey-option"
              aria-pressed={current === i + 1}
              onClick={() => answer((i + 1) as SurveyAnswer)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="test-footer survey-footer">
          {index > 0 && (
            <button type="button" className="chip" onClick={() => setViewing(index - 1)}>
              ← Назад
            </button>
          )}
          <span className="survey-saved">Ответ сохраняется сразу</span>
        </div>
      </section>
    </div>
  )
}

export default SurveyRunPage
