import { useState } from 'react'
import { Link } from 'react-router'
import { filterGames, type CatalogFilter } from '../catalog/filterGames'
import GameTags from '../components/GameTags.tsx'
import { games } from '../content/games'
import { DIFFICULTY_LABELS, GAME_TYPE_LABELS, GAME_TYPES, type Difficulty, type GameType } from '../content/schema'

const DIFFICULTIES: Difficulty[] = [1, 2, 3]

function CatalogPage() {
  const [filter, setFilter] = useState<CatalogFilter>({})
  const visible = filterGames(games, filter)

  return (
    <>
      <h1>Каталог игр</h1>
      <form className="filters" onSubmit={(event) => event.preventDefault()}>
        <label>
          Тип
          <select
            value={filter.type ?? ''}
            onChange={(event) => setFilter({ ...filter, type: (event.target.value || undefined) as GameType | undefined })}
          >
            <option value="">Все</option>
            {GAME_TYPES.map((type) => (
              <option key={type} value={type}>
                {GAME_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
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
                {DIFFICULTY_LABELS[difficulty]}
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

      {visible.length === 0 ? (
        <p>Под эти условия игр пока нет. Попробуйте изменить фильтры.</p>
      ) : (
        <ul className="game-list">
          {visible.map((game) => (
            <li key={game.id}>
              <Link to={`/games/${game.id}`} className="game-card">
                <h2>{game.title}</h2>
                <p>{game.goal}</p>
                <GameTags game={game} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default CatalogPage
