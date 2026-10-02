import { describe, expect, it } from 'vitest'
import { youtubeEmbedUrl, youtubeVideoId } from './youtube'

describe('youtubeVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=abcDEF12345', 'abcDEF12345'],
    ['https://m.youtube.com/watch?v=abcDEF12345&t=30s', 'abcDEF12345'],
    ['https://youtu.be/abcDEF12345', 'abcDEF12345'],
    ['https://www.youtube.com/embed/abcDEF12345', 'abcDEF12345'],
    ['https://www.youtube.com/shorts/abc_DEF-123', 'abc_DEF-123'],
  ])('reads the id from %s', (url, id) => {
    expect(youtubeVideoId(url)).toBe(id)
  })

  it.each(['not a url', 'https://vimeo.com/123456', 'https://www.youtube.com/watch', 'https://youtu.be/short'])(
    'returns null for %s',
    (url) => {
      expect(youtubeVideoId(url)).toBeNull()
    },
  )
})

describe('youtubeEmbedUrl', () => {
  it('builds a privacy-enhanced embed url', () => {
    expect(youtubeEmbedUrl('https://youtu.be/abcDEF12345')).toBe('https://www.youtube-nocookie.com/embed/abcDEF12345')
  })

  it('returns null when the url is not a YouTube video', () => {
    expect(youtubeEmbedUrl('https://example.com/video')).toBeNull()
  })
})
