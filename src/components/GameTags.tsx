import { GAME_TYPE_LABELS, type Game } from '../content/schema'
import DifficultyStars from './DifficultyStars.tsx'

function GameTags({ game, showVideoBadge = false }: { game: Game; showVideoBadge?: boolean }) {
  const hasVideo = game.media?.some((media) => media.kind === 'youtube') ?? false

  return (
    <ul className="tags">
      {game.types.map((type) => (
        <li key={type} className="tag tag-type" data-type={type}>
          {GAME_TYPE_LABELS[type]}
        </li>
      ))}
      <li className="tag">
        <DifficultyStars difficulty={game.difficulty} />
      </li>
      <li className="tag">
        {game.sessionMinutes.min}–{game.sessionMinutes.max} мин
      </li>
      {showVideoBadge && hasVideo && <li className="tag">▶ Видео</li>}
    </ul>
  )
}

export default GameTags
