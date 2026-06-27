// Fetches the 15 most recent videos from a YouTube channel's free RSS feed.
// No API key needed — YouTube provides this for every channel automatically.
function parseRSS(xml: string) {
  const entries = xml.split('<entry>').slice(1)
  return entries.slice(0, 12).map(entry => {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? ''
    const rawTitle = entry.match(/<title>([^<]+)<\/title>/)?.[1] ?? ''
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? ''

    const title = rawTitle
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/<!\[CDATA\[/g, '')
      .replace(/\]\]>/g, '')
      .trim()

    return {
      videoId,
      title,
      published,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    }
  }).filter(v => v.videoId)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const channelId = searchParams.get('channelId')

  if (!channelId) {
    return Response.json({ error: 'No channel ID provided' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) return Response.json({ videos: [] })

    const xml = await res.text()
    const videos = parseRSS(xml)
    return Response.json({ videos })
  } catch {
    return Response.json({ videos: [] })
  }
}
