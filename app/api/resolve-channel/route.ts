// Takes any YouTube channel URL and extracts the channel ID, name, thumbnail,
// and subscriber count (best-effort — not always available without the API).
function extractFromHtml(html: string, channelId: string) {
  const name      = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ?? ''
  const thumbnail = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? ''

  // Subscriber count is buried in YouTube's page JSON — works most of the time
  const subCount =
    html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"/)?.[1] ??
    html.match(/"subscribers":\{"simpleText":"([^"]+)"/)?.[1] ??
    ''

  return { channelId, name, thumbnail, subscriberCount: subCount }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')?.trim()

  if (!url) {
    return Response.json({ error: 'No URL provided' }, { status: 400 })
  }

  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; Embar/1.0)' }

  // Direct channel ID format: youtube.com/channel/UCxxxxxxx
  const directMatch = url.match(/youtube\.com\/channel\/(UC[\w-]+)/)
  if (directMatch) {
    const channelId = directMatch[1]
    try {
      const res  = await fetch(`https://www.youtube.com/channel/${channelId}`, { headers })
      const html = await res.text()
      return Response.json(extractFromHtml(html, channelId))
    } catch {
      return Response.json({ channelId, name: '', thumbnail: '', subscriberCount: '' })
    }
  }

  // Handle / custom URL — fetch page to resolve
  if (url.includes('youtube.com')) {
    try {
      const res  = await fetch(url, { headers })
      const html = await res.text()

      const channelId =
        html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]+)"/)?.[1] ??
        html.match(/"channelId":"(UC[\w-]+)"/)?.[1]

      if (!channelId) {
        return Response.json(
          { error: 'Could not find the channel ID. Try using the full youtube.com/channel/ID URL.' },
          { status: 400 }
        )
      }

      return Response.json(extractFromHtml(html, channelId))
    } catch {
      return Response.json(
        { error: 'Could not reach that URL. Please check it and try again.' },
        { status: 400 }
      )
    }
  }

  return Response.json({ error: 'Please paste a YouTube channel URL.' }, { status: 400 })
}
