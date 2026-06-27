import { supabase } from './supabase'

// Converts a username into the hidden placeholder email Supabase needs
function placeholderEmail(username: string) {
  return `${username.toLowerCase().trim()}@embar.users`
}

// Sign up — username + password only, no email needed
export async function signUp(username: string, password: string) {
  const trimmed = username.trim()

  // Check username is valid
  if (trimmed.length < 3) return { error: 'Username must be at least 3 characters' }
  if (trimmed.length > 30) return { error: 'Username must be under 30 characters' }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return { error: 'Username can only contain letters, numbers, and underscores' }

  // Check if username is already taken
  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', trimmed)
    .single()

  if (existing) return { error: 'That username is already taken' }

  // Create the account with a hidden placeholder email
  // Username is passed as metadata so a database trigger can save it automatically
  const { data, error } = await supabase.auth.signUp({
    email: placeholderEmail(trimmed),
    password,
    options: {
      data: { username: trimmed }
    }
  })

  if (error) return { error: error.message }
  if (!data.user) return { error: 'Something went wrong — please try again' }

  return { user: data.user, username: trimmed }
}

// Sign in — username + password
export async function signIn(username: string, password: string) {
  const trimmed = username.trim()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: placeholderEmail(trimmed),
    password,
  })

  if (error) return { error: 'Incorrect username or password' }
  return { user: data.user }
}

// Sign out
export async function signOut() {
  await supabase.auth.signOut()
}

// Get the current logged-in user's username
export async function getCurrentUsername(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  // Fall back to the username stored in auth metadata if the profile row is missing
  return data?.username ?? user.user_metadata?.username ?? null
}
