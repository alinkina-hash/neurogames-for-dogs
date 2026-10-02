import { DIFFICULTIES, type Difficulty } from '../content/schema'

function DifficultyStars({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="stars" role="img" aria-label={`Сложность: ${difficulty} из ${DIFFICULTIES.length}`}>
      {DIFFICULTIES.map((step) => (
        <span key={step} className={step <= difficulty ? 'star star-on' : 'star'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

export default DifficultyStars
