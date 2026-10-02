import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { filterGames, toggleType, type CatalogFilter } from '../catalog/filterGames'
import { groupGamesByType } from '../catalog/groupGames'
import GameTags from '../components/GameTags.tsx'
import HeroDog, { PawTrail } from '../components/HeroDog.tsx'
import TypeIcon from '../components/TypeIcon.tsx'
import WhyBlock from '../components/WhyBlock.tsx'
import { games } from '../content/games'
import { pluralRu } from '../content/plural'
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  GAME_TYPE_LABELS,
  GAME_TYPE_TAGLINES,
  GAME_TYPES,
  type Difficulty,
} from '../content/schema'

// Cards beyond this index appear together, so a long list never waits on the stagger.
const MAX_STAGGER = 6

function CatalogPage() {
  const [filter, setFilter] = useState<CatalogFilter>({})
  const selectedTypes = filter.types ?? []
  const visible = filterGames(games, filter)
  const groups = groupGamesByType(visible)

  return (
    <>
      <section className="hero">
        <PawTrail />
        <div className="hero-text">
          <h1>Игры для собачьего ума</h1>
          <p>
            Простые занятия, которые развивают нюх, память, мышление и самоконтроль. Вы читаете инструкцию — и играете
            вместе с собакой.
          </p>
          <ul className="hero-facts">
            <li>
              {games.length} {pluralRu(games.length, ['игра', 'игры', 'игр'])}
            </li>
            <li>По 5–15 минут</li>
            <li>Бесплатно</li>
          </ul>
        </div>
        <p className="hero-bubble" aria-hidden="true">
          Гав! Сыграем?
        </p>
        <HeroDog />
      </section>

      <WhyBlock />

      <div className="type-filter" role="group" aria-label="Тип игры">
        <button
          type="button"
          className="chip"
          aria-pressed={selectedTypes.length === 0}
          onClick={() => setFilter({ ...filter, types: [] })}
        >
          Все <span className="chip-count">{games.length}</span>
        </button>
        {GAME_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className="chip"
            data-type={type}
            aria-pressed={selectedTypes.includes(type)}
            onClick={() => setFilter({ ...filter, types: toggleType(selectedTypes, type) })}
          >
            <TypeIcon type={type} />
            {GAME_TYPE_LABELS[type]}{' '}
            <span className="chip-count">{games.filter((game) => game.types.includes(type)).length}</span>
          </button>
        ))}
      </div>

      <form className="filters" onSubmit={(event) => event.preventDefault()}>
        <label>
          Сложность
          <select
            value={filter.difficulty ?? ''}
            onChange={(event) =>
              setFilter({ ...filter, difficulty: (Number(event.target.value) || undefined) as Difficulty | undefined })
            }
          >
            <option value="">Любая</option>
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {'★'.repeat(difficulty) + '☆'.repeat(DIFFICULTIES.length - difficulty)} {DIFFICULTY_LABELS[difficulty]}
              </option>
            ))}
          </select>
        </label>
      </form>

      <p className="result-count" aria-live="polite">
        Найдено игр: {visible.length}
      </p>

      {groups.length === 0 && <p className="empty">Под эти условия игр пока нет. Попробуйте изменить фильтры.</p>}

      {groups.map((group) => (
        <section key={group.type} className="type-section" data-type={group.type}>
          <header className="type-heading">
            <span className="type-heading-icon">
              <TypeIcon type={group.type} />
            </span>
            <div>
              <h2>{GAME_TYPE_LABELS[group.type]}</h2>
              <p>{GAME_TYPE_TAGLINES[group.type]}</p>
            </div>
          </header>
          <ul className="game-list">
            {group.games.map((game, index) => (
              <li key={game.id} style={{ '--i': Math.min(index, MAX_STAGGER) } as CSSProperties}>
                <Link to={`/games/${game.id}`} className="game-card">
                  <span className="card-badge">
                    <TypeIcon type={group.type} />
                  </span>
                  <div className="card-body">
                    <h3>{game.title}</h3>
                    <p>{game.goal}</p>
                    <GameTags game={game} showVideoBadge />
                  </div>
                  <span className="card-mark">
                    <TypeIcon type={group.type} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

export default CatalogPage
