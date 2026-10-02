import type { GameVariation } from '../content/schema'
import DifficultyStars from './DifficultyStars.tsx'
import GameMediaView from './GameMediaView.tsx'

/** "Other ways to play" section of a game page. */
function VariationsBlock({ variations }: { variations: GameVariation[] }) {
  return (
    <section className="block">
      <h2>{variations.length === 1 ? 'Вариация игры' : 'Вариации игры'}</h2>
      <div className="variations">
        {variations.map((variation) => (
          <article key={variation.title} className="variation">
            <header className="variation-head">
              <h3>{variation.title}</h3>
              {variation.difficulty && (
                <span className="tag">
                  <DifficultyStars difficulty={variation.difficulty} />
                </span>
              )}
            </header>
            <p>{variation.description}</p>
            <ol className="steps">
              {variation.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {variation.media.map((media) => (
              <GameMediaView key={media.url} media={media} />
            ))}
            <p className="variation-sources">
              Источник:{' '}
              {variation.sources.map((source, index) => (
                <span key={source.url}>
                  {index > 0 && ', '}
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </span>
              ))}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default VariationsBlock
