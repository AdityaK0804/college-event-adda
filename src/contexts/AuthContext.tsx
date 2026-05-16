import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { signIn, signOut, signUp } from '@/services/auth.service'
import type { Profile, UserRole } from '@/lib/database.types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: any | null
  profile: Profile | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  isProfileLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export interface RegisterData {
  email: string
  password: string
  name: string
  rrn?: string
  department?: string
  year?: number
  phone?: string
  role: UserRole
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]                   = useState<Session | null>(null)
  const [profile, setProfile]                   = useState<Profile | null>(null)
  const [isLoading, setIsLoading]               = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  // ── Refs (mutable, never stale, never cause re-renders) ─────────────────

  const mountedRef     = useRef(true)
  const isSigningUp    = useRef(false)
  const fetchIdRef     = useRef(0)            // monotonic counter for dedup
  const lastLoadedId   = useRef<string | null>(null)

  // ── loadProfile ─────────────────────────────────────────────────────────

  /**
   * Fetch the profile row from Supabase.
   *
   * Dedup strategy: a monotonic counter (`fetchIdRef`).  Every call increments
   * it; when the async work resolves, it checks if ITS id is still the latest.
   * If not, the result is stale and discarded.  This is simpler and more
   * reliable than tracking user IDs because it handles ALL causes of
   * staleness (double-calls, logout mid-flight, etc.) in one mechanism.
   *
   * The finally block is UNCONDITIONAL — isProfileLoading ALWAYS resets.
   */
  const loadProfile = useCallback(async (userId: string, force = false) => {
    // Already loaded for this user and not forced
    if (!force && lastLoadedId.current === userId) {
      console.log('[Auth] loadProfile: cached for', userId, '— skip')
      return
    }

    const thisId = ++fetchIdRef.current
    console.log('[Auth] loadProfile: START', userId, `(fetch #${thisId})`)
    setIsProfileLoading(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Stale check: a newer call superseded us
      if (fetchIdRef.current !== thisId) {
        console.log('[Auth] loadProfile: STALE (fetch #' + thisId + ' superseded by #' + fetchIdRef.current + ')')
        return
      }
      if (!mountedRef.current) return

      if (error) {
        console.error('[Auth] PROFILE FETCH ERROR:', error.code, error.message)
        if (error.code === 'PGRST116') {
          // No row → best-effort stub (fire-and-forget, doesn't block)
          tryCreateStub(userId)
        }
        setProfile(null)
        return
      }

      console.log('[Auth] profile loaded ✓', data?.id)
      lastLoadedId.current = userId
      setProfile(data)
    } catch (err: any) {
      if (fetchIdRef.current !== thisId || !mountedRef.current) return
      console.error('[Auth] loadProfile unexpected:', err?.message)
      setProfile(null)
    } finally {
      // UNCONDITIONAL — isProfileLoading always resets, no matter what.
      // The stale-check above already prevents wrong data from being set.
      if (fetchIdRef.current === thisId && mountedRef.current) {
        setIsProfileLoading(false)
        console.log('[Auth] isProfileLoading → false (fetch #' + thisId + ')')
      }
    }
  }, [])

  // ── tryCreateStub — fire-and-forget, never blocks rendering ─────────────

  const tryCreateStub = async (userId: string) => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      const stub = {
        id: userId,
        email: u.email ?? '',
        name:  (u.user_metadata?.name as string) ?? 'User',
        role:  (u.user_metadata?.role as UserRole) ?? 'student',
        college: 'B.S. Abdur Rahman Crescent Institute of Science and Technology',
        rrn: null,
        department: null,
        year: null,
        phone: null,
        bio: null
      }
      console.log('[Auth] upserting stub:', stub)
      const { error } = await supabase.from('profiles').upsert(stub as any, { onConflict: 'id' })
      if (error) { console.error('[Auth] stub upsert error:', error); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (p && mountedRef.current) {
        lastLoadedId.current = userId
        setProfile(p)
        setIsProfileLoading(false)
        console.log('[Auth] stub created & fetched ✓')
      }
    } catch (e) {
      console.error('[Auth] tryCreateStub error:', e)
    }
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true
    console.log('[Auth] AuthProvider mounted')

    // STEP 1: getSession() — fast (reads localStorage).  This is our PRIMARY
    // way to unblock ProtectedRoute.  NOT onAuthStateChange, because the
    // Supabase SDK can fire INITIAL_SESSION synchronously before React has
    // committed the mount, causing setIsLoading(false) to be discarded.
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mountedRef.current) return
      console.log('[Auth] getSession →', s?.user?.id ?? 'no session')
      setSession(s)
      setIsLoading(false)
      console.log('[Auth] isLoading → false')

      if (s?.user && !isSigningUp.current) {
        loadProfile(s.user.id)   // fire-and-forget — does NOT block isLoading
      }
    }).catch(err => {
      console.error('[Auth] getSession error:', err)
      if (mountedRef.current) setIsLoading(false)
    })

    // STEP 2: Subscribe to future auth events (login, logout, token refresh).
    // The callback is NOT async — we never await inside it, so we never
    // block the Supabase event queue.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        if (!mountedRef.current) return
        console.log('[Auth] onAuthStateChange:', event, s?.user?.id ?? 'none')

        // INITIAL_SESSION is redundant — getSession() already handled it.
        // Setting session again is harmless (React dedupes same-value setState).
        setSession(s)

        if (event === 'SIGNED_IN') {
          if (isSigningUp.current) {
            console.log('[Auth] SIGNED_IN during signup — skipping profile load')
            return
          }
          // Fire-and-forget — NOT awaited
          loadProfile(s!.user.id)
        }

        if (event === 'SIGNED_OUT') {
          fetchIdRef.current++   // invalidate any in-flight fetch
          lastLoadedId.current = null
          setProfile(null)
          setIsProfileLoading(false)
        }

        // TOKEN_REFRESHED: session updated, profile doesn't change — no action.
      }
    )

    // STEP 3: Hard safety net — isLoading MUST be false within 3s no matter what
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(prev => {
          if (prev) console.warn('[Auth] Safety timeout: forcing isLoading → false')
          return false
        })
      }
    }, 3000)

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
      clearTimeout(safetyTimer)
      fetchIdRef.current++   // invalidate any in-flight fetch
    }
  }, [loadProfile])

  // ── Actions ─────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    await signIn({ email, password })
    // SIGNED_IN event fires → loadProfile runs via onAuthStateChange
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    console.log('[Auth] register() start')
    isSigningUp.current = true
    try {
      await signUp({
        email: data.email, password: data.password, name: data.name,
        rrn: data.rrn ?? '', department: data.department ?? '',
        year: data.year ?? 1, phone: data.phone ?? '', role: data.role,
      })
      console.log('[Auth] signUp succeeded')
    } finally {
      isSigningUp.current = false
      console.log('[Auth] isSigningUp → false')
    }
  }, [])

  const logout = useCallback(async () => {
    console.log('[Auth] logout()')
    // Immediately clear state — don't wait for server
    fetchIdRef.current++
    lastLoadedId.current = null
    setSession(null)
    setProfile(null)
    setIsProfileLoading(false)

    try {
      await supabase.auth.signOut()
    } catch (err: any) {
      console.warn('[Auth] signOut error (state already cleared):', err?.message)
    }
    console.log('[Auth] logout complete')
  }, [])

  const refreshProfile = useCallback(async () => {
    const uid = session?.user?.id
    if (uid) {
      lastLoadedId.current = null
      await loadProfile(uid, true)
    }
  }, [session, loadProfile])

  // ── User shim ───────────────────────────────────────────────────────────
  const userShim = session?.user
    ? {
        id:    session.user.id,
        email: session.user.email,
        name:  profile?.name  ?? (session.user.user_metadata?.name as string) ?? 'User',
        role:  profile?.role  ?? (session.user.user_metadata?.role as string) ?? 'student',
      }
    : null

  return (
    <AuthContext.Provider value={{
      user: userShim,
      profile,
      session,
      isAuthenticated: !!session,
      isLoading,
      isProfileLoading,
      login,
      register,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
