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
import { SKIP_REASON_LABELS, type DetourOutcome, type TaskResult } from '../../cogtest/types'
import { games } from '../../content/games'
import { recommendGames } from '../../cogtest/recommend'
import { GAME_TYPE_LABELS, GAME_TYPES, type GameType } from '../../content/schema'

const OUTCOME_WORDS: Record<DetourOutcome, string> = {
  fast: 'обошла за 30 секунд или быстрее',
  slow: 'обошла, но дольше 30 секунд',
  barges: 'лезла напролом или через верх',
  'gave-up': 'бросила попытки',
}

/** Raw task data in words, for the per-task details. */
function rawInWords(result: TaskResult & { status: 'done' }): string {
  if (result.trials) {
    return `верных попыток: ${result.trials.filter(Boolean).length} из ${result.trials.length}`
  }
  if (result.outcome) return OUTCOME_WORDS[result.outcome]
  if (result.seconds !== undefined) {
    return result.found === false ? 'не нашла за 2 минуты' : `время: ${result.seconds} с`
  }
  return ''
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
          <textarea
            key={test.id}
            rows={3}
            defaultValue={test.note ?? ''}
            onBlur={(event) =>
              dispatch({ type: 'setNote', testId: test.id, note: event.target.value.trim() })
            }
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
