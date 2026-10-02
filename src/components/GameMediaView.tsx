import type { GameMedia } from '../content/schema'
import { youtubeEmbedUrl, youtubeThumbnailUrl } from '../content/youtube'

// YouTube refuses to play embeds on pages without an HTTP referrer (error 153),
// which is the case when the single-file build is opened from disk.
const canEmbed = window.location.protocol !== 'file:'

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
  const thumbnailUrl = youtubeThumbnailUrl(media.url)
  if (!embedUrl || !thumbnailUrl) {
    return (
      <p>
        <a href={media.url} target="_blank" rel="noreferrer">
          {media.title}
        </a>
      </p>
    )
  }

  if (!canEmbed) {
    return (
      <figure className="media">
        <a className="video video-link" href={media.url} target="_blank" rel="noreferrer">
          <img src={thumbnailUrl} alt="" loading="lazy" />
          <span className="video-play">▶ Смотреть на YouTube</span>
        </a>
        <figcaption>{media.title}</figcaption>
      </figure>
    )
  }

  return (
    <figure className="media">
      <div className="video">
        <iframe
          src={embedUrl}
          title={media.title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <figcaption>
        {media.title} ·{' '}
        <a href={media.url} target="_blank" rel="noreferrer">
          Открыть на YouTube
        </a>
      </figcaption>
    </figure>
  )
}

export default GameMediaView
