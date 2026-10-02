import { Link, useParams } from 'react-router'
import GameMediaView from '../components/GameMediaView.tsx'
import GameTags from '../components/GameTags.tsx'
import TypeIcon from '../components/TypeIcon.tsx'
import { findGame } from '../content/games'
import type { Game } from '../content/schema'

const ADAPTATION_LABELS: Record<keyof NonNullable<Game['adaptations']>, string> = {
  puppy: 'Щенок',
  senior: 'Пожилая собака',
  small: 'Мелкая собака',
  large: 'Крупная собака',
}

function GamePage() {
  const { id } = useParams()
  const game = findGame(id)

  if (!game) {
    return (
      <>
        <p>Такой игры нет.</p>
        <Link to="/" className="back-link">
          ← В каталог
        </Link>
      </>
    )
  }

  const adaptations = Object.entries(game.adaptations ?? {}) as [keyof typeof ADAPTATION_LABELS, string][]

  return (
    <article className="game" data-type={game.types[0]}>
      <Link to="/" className="back-link">
        ← В каталог
      </Link>

      <header className="game-head">
        <span className="game-head-icon">
          <TypeIcon type={game.types[0]} />
        </span>
        <h1>{game.title}</h1>
        <GameTags game={game} />
        <p className="goal">{game.goal}</p>
      </header>

      <div className="game-body">
        {game.media?.map((media) => (
          <section key={media.url} className="block">
            <GameMediaView media={media} />
          </section>
        ))}

        <section className="block">
          <h2>Что понадобится</h2>
          {game.equipment.length === 0 ? (
            <p>Специальный инвентарь не нужен.</p>
          ) : (
            <ul>
              {game.equipment.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <p className="block-note">Подготовка: {game.prepMinutes} мин.</p>
        </section>

        <section className="block">
          <h2>Сколько играть</h2>
          <p>
            Взрослой собаке — {game.sessionMinutes.min}–{game.sessionMinutes.max} минут, щенку — 2–5 минут.
          </p>
          <p className="block-note">Лучше несколько коротких подходов в день, чем один длинный.</p>
        </section>

        <section className="block">
          <h2>Как играть</h2>
          <ol className="steps">
            {game.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="block">
          <h2>Как усложнять</h2>
          <ol className="levels">
            {game.levels.map((level) => (
              <li key={level.level}>{level.description}</li>
            ))}
          </ol>
        </section>

        <section className="block block-warn">
          <h2>Когда остановиться</h2>
          <ul>
            {game.stopSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </section>

        <section className="block block-danger">
          <h2>Безопасность</h2>
          <ul>
            {game.safety.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>

        {adaptations.length > 0 && (
          <section className="block">
            <h2>Особые случаи</h2>
            <dl>
              {adaptations.map(([key, advice]) => (
                <div key={key}>
                  <dt>{ADAPTATION_LABELS[key]}</dt>
                  <dd>{advice}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="block sources">
          <h2>Источники</h2>
          <ul>
            {game.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  )
}

export default GamePage
