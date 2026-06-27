import { useState, useEffect } from 'react'

// All available themes.
// To add a new theme: add it here AND add its CSS variables block to globals.css.
export const THEMES = [
  { id: 'light',    label: 'Nova',     type: 'platform'  as const, accent: '#1A4FD4' },
  { id: 'dark',     label: 'Dusk',     type: 'platform'  as const, accent: '#7B6FE8' },
  { id: 'ember',    label: 'Ember',    type: 'community' as const, accent: '#E07550' },
  { id: 'grove',    label: 'Grove',    type: 'community' as const, accent: '#4A8C5C' },
  { id: 'rose',     label: 'Rose',     type: 'community' as const, accent: '#C46B8A' },
  { id: 'ocean',    label: 'Ocean',    type: 'community' as const, accent: '#0EA5E9' },
  { id: 'obsidian', label: 'Obsidian', type: 'community' as const, accent: '#7C5CE8' },
  { id: 'sand',     label: 'Sand',     type: 'community' as const, accent: '#C4A570' },
  { id: 'midnight', label: 'Midnight', type: 'community' as const, accent: '#4B5FD4' },
  { id: 'gold',     label: 'Gold',     type: 'community' as const, accent: '#D4A820' },
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
    // Read the saved preference so the toggle button shows the right icon.
    // Do NOT touch data-theme here — the anti-flash script in layout.tsx already
    // set it correctly before first paint. Overriding it here would fight with
    // channel pages that apply their community theme on load.
    const saved = localStorage.getItem('embar-theme') || 'light'
    const global = saved === 'dark' ? 'dark' : 'light'
    setThemeState(global)
  }, [])

  function setTheme(t: string) {
    setThemeState(t)
    localStorage.setItem('embar-theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  return { theme, setTheme, isDark: theme === 'dark' }
}
