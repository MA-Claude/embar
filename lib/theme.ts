import { useState, useEffect } from 'react'

// All available themes.
// To add a new theme: add it here AND add its CSS variables block to globals.css.
export const THEMES = [
  { id: 'light',    label: 'Nova',     type: 'platform' as const },
  { id: 'dark',     label: 'Dusk',     type: 'platform' as const },
  { id: 'ember',    label: 'Ember',    type: 'community' as const },
  { id: 'grove',    label: 'Grove',    type: 'community' as const },
  { id: 'rose',     label: 'Rose',     type: 'community' as const },
  { id: 'ocean',    label: 'Ocean',    type: 'community' as const },
  { id: 'obsidian', label: 'Obsidian', type: 'community' as const },
  { id: 'sand',     label: 'Sand',     type: 'community' as const },
  { id: 'midnight', label: 'Midnight', type: 'community' as const },
  { id: 'gold',     label: 'Gold',     type: 'community' as const },
]

export const COMMUNITY_THEMES = THEMES.filter(t => t.type === 'community')

// Deterministically pick a community theme for a channel based on its name.
// Once community leaders can set their own theme, this becomes the fallback.
export function defaultCommunityTheme(channelName: string) {
  let n = 0
  for (let i = 0; i < channelName.length; i++) n += channelName.charCodeAt(i)
  return COMMUNITY_THEMES[n % COMMUNITY_THEMES.length]
}

// Hook for reading and writing the global platform theme (light / dark).
// Sets data-theme on <html> and persists to localStorage.
export function useTheme() {
  const [theme, setThemeState] = useState<string>('light')

  useEffect(() => {
    const saved = localStorage.getItem('embar-theme') || 'light'
    // Only restore light or dark as the global theme
    const global = saved === 'dark' ? 'dark' : 'light'
    setThemeState(global)
    document.documentElement.setAttribute('data-theme', global)
  }, [])

  function setTheme(t: string) {
    setThemeState(t)
    localStorage.setItem('embar-theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  return { theme, setTheme, isDark: theme === 'dark' }
}
