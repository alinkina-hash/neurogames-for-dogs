import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import Stopwatch from '../../components/cogtest/Stopwatch'
import TypeIcon from '../../components/TypeIcon'
import { useCogStoreContext } from '../../cogtest/CogStoreContext'
import { doneResult, timerRaw } from '../../cogtest/scoring'
import { preparationEquipment, TEST_TASKS } from '../../cogtest/tasks'
import {
  DETOUR_OUTCOME_LABELS,
  SKIP_REASON_LABELS,
  type DetourOutcome,
  type RawResult,
  type SkipReason,
  type TaskResult,
  type TestTask,
} from '../../cogtest/types'
import { findGame } from '../../content/games'
import { GAME_TYPE_LABELS } from '../../content/schema'

const OUTCOMES = (Object.keys(DETOUR_OUTCOME_LABELS) as DetourOutcome[]).map((value) => ({
  value,
  label: DETOUR_OUTCOME_LABELS[value],
}))

const ALL_EQUIPMENT = preparationEquipment()

function NotFound() {
  return (
    <div className="block test-run">
      <h1>Тест не найден</h1>
      <p>
        <a href="#/profile">← К профилям</a>
      </p>
    </div>
  )
}

function Preparation({ dogName, onStart }: { dogName: string; onStart: () => void }) {
  return (
    <div className="test-run">
      <p className="test-dog">Тест для: {dogName}</p>
      <section className="block">
        <h1>Подготовка</h1>
        <ul className="test-checklist">
          <li>Выберите тихую комнату, где ничто не отвлекает.</li>
          <li>Лучше проводить тест, когда собака слегка проголодалась.</li>
          <li>Если можно, позовите помощника: он придержит собаку или засечёт время.</li>
          <li>
            Приготовьте всё необходимое:
            <ul>
              {ALL_EQUIPMENT.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        </ul>
        <p className="test-disclaimer">
          Это не ветеринарный диагноз. Тест только показывает, как собака справляется с заданиями
          сейчас, и сравнивает её только с ней самой.
        </p>
        <button type="button" className="button test-next" onClick={onStart}>
          Начать
        </button>
      </section>
    </div>
  )
}

interface RecorderProps {
  task: TestTask
  existing?: TaskResult
  isLast: boolean
  onSave: (raw: RawResult) => void
}

function Recorder({ task, existing, isLast, onSave }: RecorderProps) {
  const done = existing?.status === 'done' ? existing : undefined
  const [trials, setTrials] = useState<(boolean | null)[]>(() =>
    Array.from({ length: task.trialCount ?? 3 }, (_, i) => done?.trials?.[i] ?? null),
  )
  const [seconds, setSeconds] = useState<number | null>(done?.seconds ?? null)
  const [found, setFound] = useState<boolean | undefined>(done?.found)
  const [running, setRunning] = useState(false)
  const [outcome, setOutcome] = useState<DetourOutcome | null>(done?.outcome ?? null)
  const nextLabel = isLast ? 'Завершить' : 'Дальше'

  if (task.kind === 'trials') {
    const complete = trials.every((value) => value !== null)
    return (
      <>
        <div className="trial-list">
          {trials.map((value, i) => (
            <div className="trial-row" key={i} role="group" aria-label={`Попытка ${i + 1}`}>
              <span className="trial-name">Попытка {i + 1}</span>
              <button
                type="button"
                className="chip"
                aria-pressed={value === true}
                onClick={() => setTrials((prev) => prev.map((v, j) => (j === i ? true : v)))}
              >
                Верно
              </button>
              <button
                type="button"
                className="chip"
                aria-pressed={value === false}
                onClick={() => setTrials((prev) => prev.map((v, j) => (j === i ? false : v)))}
              >
                Неверно
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="button test-next"
          disabled={!complete}
          onClick={() => onSave({ trials: trials as boolean[] })}
        >
          {nextLabel}
        </button>
      </>
    )
  }

  if (task.kind === 'timer') {
    const limit = task.timerLimitSeconds
    return (
      <>
        <Stopwatch
          limitSeconds={limit}
          onStart={() => {
            setRunning(true)
            setSeconds(null)
            setFound(undefined)
          }}
          onStop={(value) => {
            setRunning(false)
            setSeconds(value)
            setFound(undefined)
          }}
          onReset={() => {
            setRunning(false)
            setSeconds(null)
            setFound(undefined)
          }}
        />
        {seconds !== null && <p className="test-recorded">Записано: {seconds} с</p>}
        {task.id === 'towel-find' && (
          <button
            type="button"
            className="button test-secondary"
            onClick={() => onSave({ seconds: 120, found: false })}
          >
            Не нашла
          </button>
        )}
        <button
          type="button"
          className="button test-next"
          disabled={running || seconds === null}
          onClick={() => !running && seconds !== null && onSave(timerRaw(seconds, found))}
        >
          {nextLabel}
        </button>
      </>
    )
  }

  return (
    <>
      <div className="outcome-list">
        {OUTCOMES.map((item) => (
          <button
            key={item.value}
            type="button"
            className="chip outcome-button"
            aria-pressed={outcome === item.value}
            onClick={() => setOutcome(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="button test-next"
        disabled={outcome === null}
        onClick={() => outcome && onSave({ outcome })}
      >
        {nextLabel}
      </button>
    </>
  )
}

function TestRunPage() {
  const { testId } = useParams()
  const { store, dispatch } = useCogStoreContext()
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [viewing, setViewing] = useState<number | null>(null)
  const [skipOpen, setSkipOpen] = useState(false)

  const test = store.tests.find((t) => t.id === testId)
  if (!test) return <NotFound />
  if (test.finishedAt) return <Navigate to={`/profile/result/${test.id}`} replace />

  const dog = store.dogs.find((d) => d.id === test.dogId)
  const dogName = dog?.name ?? ''
  const recorded = TEST_TASKS.filter((task) => test.tasks[task.id]).length

  if (recorded === 0 && !started) {
    return <Preparation dogName={dogName} onStart={() => setStarted(true)} />
  }

  const firstOpen = TEST_TASKS.findIndex((task) => !test.tasks[task.id])
  const index = viewing ?? (firstOpen === -1 ? TEST_TASKS.length - 1 : firstOpen)
  const task = TEST_TASKS[index]
  const isLast = index === TEST_TASKS.length - 1
  const game = task.relatedGameId ? findGame(task.relatedGameId) : undefined

  function go(result: TaskResult) {
    dispatch({ type: 'recordTask', testId: test!.id, taskId: task.id, result })
    setSkipOpen(false)
    if (isLast) {
      dispatch({ type: 'finishTest', testId: test!.id, now: new Date().toISOString() })
      navigate(`/profile/result/${test!.id}`, { replace: true })
    } else {
      setViewing(index + 1)
      window.scrollTo(0, 0)
    }
  }

  function save(raw: RawResult) {
    go(doneResult(task.id, raw))
  }

  function back() {
    setSkipOpen(false)
    setViewing(index - 1)
    window.scrollTo(0, 0)
  }

  return (
    <div className="test-run" data-type={task.skill}>
      <p className="test-dog">Тест для: {dogName}</p>
      <section className="block test-task">
        <p className="test-progress">
          Задание {index + 1} из {TEST_TASKS.length}
        </p>
        <p className="test-skill">
          <TypeIcon type={task.skill} />
          {GAME_TYPE_LABELS[task.skill]}
        </p>
        <h1>{task.title}</h1>
        <p className="test-goal">{task.goal}</p>

        <h2>Что понадобится</h2>
        <ul className="test-equipment">
          {task.equipment.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>Как проводить</h2>
        <ol className="steps">
          {task.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        {game && (
          <p className="test-related">
            Похожая игра: <Link to={`/games/${game.id}`}>{game.title}</Link>
          </p>
        )}

        <p className="test-stop-signal">Если собака нервничает — пропустите задание</p>

        <h2>Результат</h2>
        <Recorder
          key={task.id}
          task={task}
          existing={test.tasks[task.id]}
          isLast={isLast}
          onSave={save}
        />

        <div className="test-footer">
          {index > 0 && (
            <button type="button" className="chip" onClick={back}>
              ← Назад к заданию {index}
            </button>
          )}
          <button
            type="button"
            className="chip"
            aria-expanded={skipOpen}
            onClick={() => setSkipOpen((open) => !open)}
          >
            Пропустить
          </button>
        </div>
        {skipOpen && (
          <div className="skip-reasons" role="group" aria-label="Причина пропуска">
            <p>Почему пропускаете?</p>
            {(Object.keys(SKIP_REASON_LABELS) as SkipReason[]).map((reason) => (
              <button
                key={reason}
                type="button"
                className="chip"
                onClick={() => go({ status: 'skipped', reason })}
              >
                {SKIP_REASON_LABELS[reason][0].toUpperCase() + SKIP_REASON_LABELS[reason].slice(1)}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default TestRunPage
