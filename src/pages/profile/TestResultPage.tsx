import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import SkillRow from '../../components/cogtest/SkillRow'
import Delta from '../../components/cogtest/Delta'
import GameTags from '../../components/GameTags'
import TypeIcon from '../../components/TypeIcon'
import { compareTests, previousTest } from '../../cogtest/compare'
import { useCogStoreContext } from '../../cogtest/CogStoreContext'
import { formatDate } from '../../cogtest/format'
import { summarizeTest } from '../../cogtest/scoring'
import { TEST_TASKS } from '../../cogtest/tasks'
import { DETOUR_OUTCOME_LABELS, SKIP_REASON_LABELS, type TaskResult } from '../../cogtest/types'
import { games } from '../../content/games'
import { recommendGames } from '../../cogtest/recommend'
import { GAME_TYPE_LABELS, GAME_TYPES, type GameType } from '../../content/schema'

/** Raw task data in words, for the per-task details. */
function rawInWords(result: TaskResult & { status: 'done' }): string {
  if (result.trials) {
    return `верных попыток: ${result.trials.filter(Boolean).length} из ${result.trials.length}`
  }
  if (result.outcome) {
    const label = DETOUR_OUTCOME_LABELS[result.outcome]
    return label.charAt(0).toLowerCase() + label.slice(1)
  }
  if (result.seconds !== undefined) {
    return result.found === false ? 'не нашла за 2 минуты' : `время: ${result.seconds} с`
  }
  return ''
}

const NOTE_DELAY_MS = 500

/** The note saves itself shortly after typing stops, on blur, when the page is hidden and on leaving. */
function NoteField({ initial, onSave }: { initial: string; onSave: (note: string) => void }) {
  const [value, setValue] = useState(initial)
  const pending = useRef<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const save = useRef(onSave)
  useEffect(() => {
    save.current = onSave
  })

  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    if (pending.current === null) return
    const note = pending.current.trim()
    pending.current = null
    save.current(note)
  }, [])

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  return (
    <textarea
      rows={3}
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
        pending.current = event.target.value
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(flush, NOTE_DELAY_MS)
      }}
      onBlur={flush}
    />
  )
}

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

function TestResultPage() {
  const { testId } = useParams()
  const { store, dispatch } = useCogStoreContext()
  const test = store.tests.find((t) => t.id === testId)
  const dog = test && store.dogs.find((d) => d.id === test.dogId)
  if (!test || !dog) return <NotFound />
  if (!test.finishedAt) return <Navigate replace to={`/profile/run/${test.id}`} />

  const summary = summarizeTest(test.tasks)
  const before = previousTest(store.tests, test)
  const comparison = before ? compareTests(test, before) : undefined
  const weakest = summary.weakest[0]
  const recommended = weakest ? recommendGames(weakest, games) : []
  const names = (list: GameType[]) => list.map((skill) => GAME_TYPE_LABELS[skill]).join(', ')

  return (
    <div className="result-page">
      <header className="result-head">
        <p className="test-dog">{dog.name}</p>
        <h1>Результат теста</h1>
        <p className="result-date">{formatDate(test.startedAt)}</p>
        <p className="result-total">{summary.total === null ? 'Тест неполный' : `${summary.total} из 24`}</p>
      </header>

      <section className="block">
        <h2>Навыки</h2>
        <ul className="skill-list">
          {GAME_TYPES.map((skill) => (
            <SkillRow
              key={skill}
              skill={skill}
              entry={summary.skills[skill]}
              change={comparison?.skills[skill]}
              showBefore
            />
          ))}
        </ul>
        {before && (
          <p className="result-compare-note">Сравнение с тестом от {formatDate(before.startedAt)}.</p>
        )}
      </section>

      {(summary.strongest.length > 0 || summary.weakest.length > 0) && (
        <section className="block result-sides">
          <p>
            <strong>Сильная сторона:</strong> {names(summary.strongest)}
          </p>
          <p>
            <strong>Над чем поработать:</strong> {names(summary.weakest)}
          </p>
        </section>
      )}

      {recommended.length > 0 && weakest && (
        <section data-type={weakest}>
          <header className="type-heading">
            <span className="type-heading-icon">
              <TypeIcon type={weakest} />
            </span>
            <div>
              <h2>Игры для навыка «{GAME_TYPE_LABELS[weakest]}»</h2>
              <p>Начните с самых лёгких.</p>
            </div>
          </header>
          <ul className="game-list">
            {recommended.map((game) => (
              <li key={game.id}>
                <Link to={`/games/${game.id}`} className="game-card">
                  <span className="card-badge">
                    <TypeIcon type={weakest} />
                  </span>
                  <div className="card-body">
                    <h3>{game.title}</h3>
                    <p>{game.goal}</p>
                    <GameTags game={game} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="block">
        <h2>Разбор по заданиям</h2>
        {TEST_TASKS.map((task) => {
          const result = test.tasks[task.id]
          const change = comparison?.tasks[task.id]
          return (
            <details key={task.id} className="task-detail" data-type={task.skill}>
              <summary>
                <span className="task-title">{task.title}</span>
                <span className="task-score">
                  {result?.status === 'done' ? `${result.score} из 3` : result ? 'пропущено' : 'не выполнено'}
                </span>
              </summary>
              <div className="task-body">
                {result?.status === 'done' && <p>Результат: {rawInWords(result)}.</p>}
                {result?.status === 'skipped' && <p>Причина: {SKIP_REASON_LABELS[result.reason]}.</p>}
                {change && (
                  <p>
                    В прошлый раз: {change.before} из 3 <Delta delta={change.delta} />
                  </p>
                )}
              </div>
            </details>
          )
        })}
      </section>

      <section className="block">
        <h2>Заметка</h2>
        <label className="result-note">
          Условия теста, настроение собаки (необязательно)
          <NoteField
            key={test.id}
            initial={test.note ?? ''}
            onSave={(note) => dispatch({ type: 'setNote', testId: test.id, note })}
          />
        </label>
      </section>

      <section className="block block-note">
        <p>
          Проводите тест в одинаковых условиях и не чаще раза в месяц. Рост на втором прохождении отчасти
          объясняется тем, что собака уже знакома с заданиями.
        </p>
        <p>Тест не является ветеринарной диагностикой.</p>
      </section>

      <nav className="profile-actions">
        <Link to={`/profile/dog/${dog.id}`} className="chip">
          История собаки
        </Link>
        <Link to="/profile" className="chip">
          К собакам
        </Link>
      </nav>
    </div>
  )
}

export default TestResultPage
