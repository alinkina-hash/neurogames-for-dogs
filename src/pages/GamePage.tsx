import { Link, useParams } from 'react-router'
import GameMediaView from '../components/GameMediaView.tsx'
import GameTags from '../components/GameTags.tsx'
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
        <Link to="/">← В каталог</Link>
      </>
    )
  }

  const adaptations = Object.entries(game.adaptations ?? {}) as [keyof typeof ADAPTATION_LABELS, string][]

  return (
    <article className="game">
      <Link to="/">← В каталог</Link>
      <h1>{game.title}</h1>
      <GameTags game={game} />
      <p className="goal">{game.goal}</p>

      {game.media?.map((media) => <GameMediaView key={media.url} media={media} />)}

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
      <p>Подготовка: {game.prepMinutes} мин.</p>

      <h2>Как играть</h2>
      <ol>
        {game.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h2>Как усложнять</h2>
      <ol>
        {game.levels.map((level) => (
          <li key={level.level}>{level.description}</li>
        ))}
      </ol>

      <h2>Сколько играть</h2>
      <p>
        Взрослой собаке — {game.sessionMinutes.min}–{game.sessionMinutes.max} минут, щенку — 2–5 минут. Лучше несколько
        коротких подходов в день, чем один длинный.
      </p>

      <h2>Когда остановиться</h2>
      <ul>
        {game.stopSignals.map((signal) => (
          <li key={signal}>{signal}</li>
        ))}
      </ul>

      <h2>Безопасность</h2>
      <ul>
        {game.safety.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      {adaptations.length > 0 && (
        <>
          <h2>Особые случаи</h2>
          <dl>
            {adaptations.map(([key, advice]) => (
              <div key={key}>
                <dt>{ADAPTATION_LABELS[key]}</dt>
                <dd>{advice}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

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

      <p className="disclaimer">
        Это не ветеринарная рекомендация. При проблемах со здоровьем собаки посоветуйтесь с ветеринаром.
      </p>
    </article>
  )
}

export default GamePage
