import { supabase } from './supabase'

export type Channel = {
  id: string
  youtube_channel_id: string
  name: string
  description: string
  thumbnail_url: string
  youtube_url: string
  added_by: string | null
  created_at: string
}

export async function getChannels(): Promise<Channel[]> {
  const { data } = await supabase
    .from('channels')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getChannel(youtubeChannelId: string): Promise<Channel | null> {
  const { data } = await supabase
    .from('channels')
    .select('*')
    .eq('youtube_channel_id', youtubeChannelId)
    .single()
  return data
}

export async function addChannel(channel: {
  youtube_channel_id: string
  name: string
  description: string
  thumbnail_url: string
  youtube_url: string
  added_by: string
}): Promise<{ error?: string }> {
  const { error } = await supabase.from('channels').insert(channel)
  if (error) {
    if (error.code === '23505') return { error: 'This channel has already been added to Embar' }
    return { error: error.message }
  }
  return {}
}
