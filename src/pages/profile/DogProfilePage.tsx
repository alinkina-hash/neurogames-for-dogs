import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import Delta from '../../components/cogtest/Delta'
import SkillRow from '../../components/cogtest/SkillRow'
import StartTestButton from '../../components/cogtest/StartTestButton'
import SurveyCard from '../../components/cogtest/SurveyCard'
import TrendChart from '../../components/cogtest/TrendChart'
import { compareTests, previousTest } from '../../cogtest/compare'
import { useCogStoreContext } from '../../cogtest/CogStoreContext'
import { ageText, formatDate, formatDayMonth, testsCountText } from '../../cogtest/format'
import { latestFinished, unfinishedTest } from '../../cogtest/reducer'
import { summarizeTest } from '../../cogtest/scoring'
import type { CogTest, Store } from '../../cogtest/types'
import { GAME_TYPE_LABELS, GAME_TYPES } from '../../content/schema'

const DAY_MS = 86_400_000

function NotFound() {
  return (
    <div className="block test-run">
      <h1>Собака не найдена</h1>
      <p>
        <a href="#/profile">← К профилям</a>
      </p>
    </div>
  )
}

function FeedLine({ store, test }: { store: Store; test: CogTest }) {
  const summary = summarizeTest(test.tasks)
  const before = previousTest(store.tests, test)
  const beforeTotal = before ? summarizeTest(before.tasks).total : null
  const totalDelta =
    summary.total !== null && beforeTotal !== null ? summary.total - beforeTotal : undefined
  return (
    <>
      <span className="feed-date">{formatDate(test.startedAt)}</span>
      <span className="feed-total">
        {summary.total === null ? 'неполный' : `${summary.total} / 24`}
        {totalDelta !== undefined && (
          <>
            {' '}
            <Delta delta={totalDelta} />
          </>
        )}
      </span>
    </>
  )
}

function FeedBody({ store, test }: { store: Store; test: CogTest }) {
  const summary = summarizeTest(test.tasks)
  const before = previousTest(store.tests, test)
  const comparison = before ? compareTests(test, before) : undefined
  return (
    <div className="feed-body">
      <ul className="skill-list">
        {GAME_TYPES.map((skill) => (
          <SkillRow
            key={skill}
            skill={skill}
            entry={summary.skills[skill]}
            change={comparison?.skills[skill]}
          />
        ))}
      </ul>
      <Link to={`/profile/result/${test.id}`} className="feed-more">
        Подробнее о тесте →
      </Link>
    </div>
  )
}

function DogProfilePage() {
  const { dogId } = useParams()
  const { store } = useCogStoreContext()
  const [now] = useState(() => new Date())
  const dog = store.dogs.find((d) => d.id === dogId)
  const [searchParams] = useSearchParams()
  const scrollToSurvey = searchParams.get('to') === 'survey' && dog !== undefined

  // Runs after ScrollManager has opened the screen at the top. Uses layout offsets, not
  // scrollIntoView: the card's entrance animation scales it, which would skew the target.
  useEffect(() => {
    if (!scrollToSurvey) return
    let top = 0
    for (let node = document.getElementById('survey'); node; node = node.offsetParent as HTMLElement | null) {
      top += node.offsetTop
    }
    if (top > 0) window.scrollTo(0, top - 16)
  }, [scrollToSurvey])

  if (!dog) return <NotFound />

  const finished = store.tests
    .filter((t) => t.dogId === dog.id && t.finishedAt)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
  const unfinished = unfinishedTest(store, dog.id)
  const oldestFirst = [...finished].reverse()

  const totalPoints = oldestFirst.flatMap((t) => {
    const total = summarizeTest(t.tasks).total
    return total === null ? [] : [{ date: t.startedAt, value: total }]
  })

  const latest = latestFinished(store, dog.id)
  const nextDate = latest ? new Date(Date.parse(latest.startedAt) + 30 * DAY_MS) : undefined
  const showNext = nextDate !== undefined && nextDate.getTime() > now.getTime()

  const latestBefore = latest ? previousTest(store.tests, latest) : undefined
  const latestComparison = latest && latestBefore ? compareTests(latest, latestBefore) : undefined

  const details = [ageText(dog.birthMonth, now), testsCountText(finished.length)]
  const subtitle = [dog.breed, ...details].filter(Boolean).join(' · ')

  return (
    <div className="dog-page">
      <header className="dog-head">
        <span className="dog-avatar" aria-hidden="true">
          {dog.name.trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <h1>{dog.name}</h1>
          <p className="dog-sub">{subtitle}</p>
        </div>
      </header>
      <div className="dog-start">
        <StartTestButton dogId={dog.id} />
        {showNext && nextDate && (
          <p className="dog-hint">Следующий тест лучше после {formatDayMonth(nextDate.toISOString())}</p>
        )}
      </div>

      <section className="block">
        <h2>Общий балл</h2>
        <TrendChart points={totalPoints} max={24} label="Общий балл из 24" />
      </section>

      <section>
        <h2 className="dog-h2">По навыкам</h2>
        <div className="mini-grid">
          {GAME_TYPES.map((skill) => {
            const points = oldestFirst.flatMap((t) => {
              const entry = summarizeTest(t.tasks).skills[skill]
              return entry.complete ? [{ date: t.startedAt, value: entry.score }] : []
            })
            const last = points[points.length - 1]
            const change = latestComparison?.skills[skill]
            return (
              <div key={skill} className="block mini-chart" data-type={skill}>
                <p className="mini-title">
                  <b>{GAME_TYPE_LABELS[skill]}</b>
                  {last && (
                    <span className="mini-score">
                      {last.value} из 6{change && <> <Delta delta={change.delta} /></>}
                    </span>
                  )}
                </p>
                <TrendChart
                  points={points}
                  max={6}
                  label={`${GAME_TYPE_LABELS[skill]}, баллы из 6`}
                  color="var(--type)"
                  compact
                />
              </div>
            )
          })}
        </div>
      </section>

      <section className="block block-note">
        <p>
          Рост при повторных прохождениях отчасти объясняется тем, что собака уже знакома с
          заданиями.
        </p>
      </section>

      <section>
        <h2 className="dog-h2">Тесты</h2>
        {unfinished && (
          <div className="profile-warning feed-unfinished">
            <p>Тест от {formatDayMonth(unfinished.startedAt)} не закончен</p>
            <Link to={`/profile/run/${unfinished.id}`} className="button">
              Продолжить
            </Link>
          </div>
        )}
        {finished.length === 0 && !unfinished && <p className="dog-hint">Тестов пока нет.</p>}
        <ul className="feed">
          {finished.map((test, i) => (
            <li key={test.id} className="block feed-item">
              {i === 0 ? (
                <>
                  <div className="feed-line">
                    <FeedLine store={store} test={test} />
                  </div>
                  <FeedBody store={store} test={test} />
                </>
              ) : (
                <details>
                  <summary className="feed-line">
                    <FeedLine store={store} test={test} />
                  </summary>
                  <FeedBody store={store} test={test} />
                </details>
              )}
            </li>
          ))}
        </ul>
      </section>

      <SurveyCard dog={dog} now={now} />
    </div>
  )
}

export default DogProfilePage
