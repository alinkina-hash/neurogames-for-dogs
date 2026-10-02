import { DIFFICULTY_LABELS, GAME_TYPE_LABELS, type Game } from '../content/schema'

function GameTags({ game }: { game: Game }) {
  return (
    <ul className="tags">
      {game.types.map((type) => (
        <li key={type} className="tag tag-type">
          {GAME_TYPE_LABELS[type]}
        </li>
      ))}
      <li className="tag">{DIFFICULTY_LABELS[game.difficulty]}</li>
      <li className="tag">
        {game.sessionMinutes.min}–{game.sessionMinutes.max} мин
      </li>
    </ul>
  )
}

export default GameTags
