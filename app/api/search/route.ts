import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return Response.json({ channels: [], videos: [] })
  }

  const [channelRes, videoRes] = await Promise.all([
    supabase.rpc('search_channels_ranked', { search_query: q }),
    supabase.rpc('search_videos_ranked', { search_query: q }),
  ])

  return Response.json({
    channels: channelRes.data ?? [],
    videos:   videoRes.data  ?? [],
  })
}
