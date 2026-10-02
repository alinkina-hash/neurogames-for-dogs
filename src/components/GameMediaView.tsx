import type { GameMedia } from '../content/schema'
import { youtubeEmbedUrl } from '../content/youtube'

function GameMediaView({ media }: { media: GameMedia }) {
  if (media.kind === 'photo') {
    return (
      <figure className="media">
        <img src={media.url} alt="" loading="lazy" />
        <figcaption>
          Фото: {media.author}, {media.license}
        </figcaption>
      </figure>
    )
  }

  const embedUrl = youtubeEmbedUrl(media.url)
  if (!embedUrl) {
    return (
      <p>
        <a href={media.url} target="_blank" rel="noreferrer">
          {media.title}
        </a>
      </p>
    )
  }
  return (
    <figure className="media">
      <div className="video">
        <iframe src={embedUrl} title={media.title} loading="lazy" allowFullScreen />
      </div>
      <figcaption>{media.title}</figcaption>
    </figure>
  )
}

export default GameMediaView
