import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/lib/database.types'

export interface SignUpData {
  email: string
  password: string
  name: string
  rrn: string
  department: string
  year: number
  phone: string
  role: UserRole
}

export interface SignInData {
  email: string
  password: string
}

/** Sign up a new user and create their profile row */
export async function signUp(data: SignUpData) {
  const { email, password, name, rrn, department, year, phone, role } = data

  console.log('[signUp] Starting signup for:', email)

  // ── Step 1: Create the auth user with a timeout guard ────────────────────
  let authData: Awaited<ReturnType<typeof supabase.auth.signUp>>['data']

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase auth.signUp timed out after 15 seconds')), 15_000)
    )

    const signUpPromise = supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }, // stored in auth.users raw_user_meta_data
      },
    })

    const result = await Promise.race([signUpPromise, timeoutPromise]) as Awaited<typeof signUpPromise>
    console.log('[signUp] auth.signUp resolved:', { user: result.data?.user?.id, error: result.error?.message })

    if (result.error) throw result.error
    if (!result.data?.user) throw new Error('Sign-up succeeded but no user was returned')

    authData = result.data
  } catch (err) {
    console.error('[signUp] auth.signUp failed:', err)
    throw err
  }

  const userId = authData.user!.id
  console.log('[signUp] Auth user created, userId:', userId)

  // ── Step 2: Insert the profile row ───────────────────────────────────────
  // NOTE: We use the anon client — ensure RLS allows the owning user to insert
  // their own profile (policy: auth.uid() = id).
  console.log('[signUp] Inserting profile row…')

  try {
    const profileTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Profile insert timed out after 10 seconds')), 10_000)
    )

    const insertPromise = supabase.from('profiles').insert({
      id: userId,
      email,
      name,
      rrn: rrn || null,
      department: department || null,
      year: year || null,
      phone: phone || null,
      role,
      college: 'B.S. Abdur Rahman Crescent Institute of Science and Technology',
    })

    const { error: profileError } = await Promise.race([insertPromise, profileTimeoutPromise]) as Awaited<typeof insertPromise>

    if (profileError) {
      console.error('[signUp] Profile insert failed:', profileError)
      // Sign out so the orphaned auth user doesn't leave the client in a broken session
      await supabase.auth.signOut().catch(() => null)
      throw new Error(`Account created but profile setup failed: ${profileError.message}`)
    }

    console.log('[signUp] Profile inserted successfully')
  } catch (err) {
    console.error('[signUp] Profile step error:', err)
    throw err
  }

  console.log('[signUp] Signup complete')
  return authData
}

/** Sign in with email + password */
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** Sign out the current session */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** Fetch the profile for a given user ID */
export async function getProfile(userId: string): Promise<Profile> {
  console.log('[getProfile] Fetching profile for userId:', userId)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('PROFILE FETCH ERROR:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      status: (error as any).status,
    })
    throw error
  }

  console.log('[getProfile] Raw profile data from Supabase:', data)
  return data
}

/** Update profile fields */
export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Send password reset email */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}
