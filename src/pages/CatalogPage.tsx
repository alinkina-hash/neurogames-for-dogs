import { useState } from 'react'
import { Link } from 'react-router'
import { filterGames, toggleType, type CatalogFilter } from '../catalog/filterGames'
import GameTags from '../components/GameTags.tsx'
import { games } from '../content/games'
import { DIFFICULTIES, GAME_TYPE_LABELS, GAME_TYPES, type Difficulty } from '../content/schema'

function CatalogPage() {
  const [filter, setFilter] = useState<CatalogFilter>({})
  const selectedTypes = filter.types ?? []
  const visible = filterGames(games, filter)

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <h1>Игры для собачьего ума</h1>
          <p>
            Простые занятия, которые развивают нюх, память, мышление и самоконтроль. Вы читаете инструкцию — и играете
            вместе с собакой.
          </p>
          <ul className="hero-facts">
            <li>{games.length} игр</li>
            <li>5–15 минут в день</li>
            <li>Бесплатно</li>
          </ul>
        </div>
      </section>

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
                {'★'.repeat(difficulty) + '☆'.repeat(DIFFICULTIES.length - difficulty)}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filter.noEquipment ?? false}
            onChange={(event) => setFilter({ ...filter, noEquipment: event.target.checked })}
          />
          Без инвентаря
        </label>
      </form>

      <p className="result-count" aria-live="polite">
        Найдено игр: {visible.length}
      </p>

      {visible.length === 0 ? (
        <p className="empty">Под эти условия игр пока нет. Попробуйте изменить фильтры.</p>
      ) : (
        <ul className="game-list">
          {visible.map((game) => (
            <li key={game.id}>
              <Link to={`/games/${game.id}`} className="game-card" data-type={game.types[0]}>
                <h2>{game.title}</h2>
                <p>{game.goal}</p>
                <GameTags game={game} showVideoBadge />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default CatalogPage
