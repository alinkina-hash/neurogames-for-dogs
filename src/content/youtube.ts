const VIDEO_ID = /^[\w-]{11}$/

/** Extracts the video id from a YouTube watch, short or embed URL. */
export function youtubeVideoId(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^(www|m)\./, '')
  let id: string | null = null
  if (host === 'youtu.be') {
    id = parsed.pathname.slice(1)
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, kind, value] = parsed.pathname.split('/')
    id = kind === 'watch' ? parsed.searchParams.get('v') : kind === 'embed' || kind === 'shorts' ? value : null
  }
  return id && VIDEO_ID.test(id) ? id : null
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeVideoId(url)
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
}

export function youtubeThumbnailUrl(url: string): string | null {
  const id = youtubeVideoId(url)
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}
