import { supabase } from '@/lib/supabase'

function decodeEntities(str: string) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim()
}

function parseRSS(xml: string) {
  const entries = xml.split('<entry>').slice(1)
  return entries.slice(0, 12).map(entry => {
    const videoId    = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? ''
    const rawTitle   = entry.match(/<title>([^<]+)<\/title>/)?.[1] ?? ''
    const published  = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? ''
    const rawDesc    = entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? ''

    return {
      videoId,
      title:       decodeEntities(rawTitle),
      description: decodeEntities(rawDesc),
      published,
      thumbnail:   `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      url:         `https://www.youtube.com/watch?v=${videoId}`,
    }
  }).filter(v => v.videoId)
}

async function saveVideosToDB(channelId: string, videos: ReturnType<typeof parseRSS>) {
  if (!videos.length) return
  const rows = videos.map(v => ({
    channel_id:   channelId,
    video_id:     v.videoId,
    title:        v.title,
    description:  v.description,
    published_at: v.published || null,
    thumbnail_url: v.thumbnail,
  }))
  await supabase
    .from('videos')
    .upsert(rows, { onConflict: 'video_id' })
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

    const xml    = await res.text()
    const videos = parseRSS(xml)

    // Save to DB in the background — doesn't block the response
    saveVideosToDB(channelId, videos).catch(() => {})

    return Response.json({ videos })
  } catch {
    return Response.json({ videos: [] })
  }
}
