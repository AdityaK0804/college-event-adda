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
      return
    }

    const thisId = ++fetchIdRef.current
    setIsProfileLoading(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Stale check: a newer call superseded us
      if (fetchIdRef.current !== thisId) {
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
      const { error } = await supabase.from('profiles').upsert(stub as any, { onConflict: 'id' })
      if (error) { console.error('[Auth] stub upsert error:', error); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (p && mountedRef.current) {
        lastLoadedId.current = userId
        setProfile(p)
        setIsProfileLoading(false)
      }
    } catch (e) {
      console.error('[Auth] tryCreateStub error:', e)
    }
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true

    // STEP 1: getSession() — fast (reads localStorage).  This is our PRIMARY
    // way to unblock ProtectedRoute.  NOT onAuthStateChange, because the
    // Supabase SDK can fire INITIAL_SESSION synchronously before React has
    // committed the mount, causing setIsLoading(false) to be discarded.
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mountedRef.current) return
      setSession(s)
      setIsLoading(false)

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

        // INITIAL_SESSION is redundant — getSession() already handled it.
        // Setting session again is harmless (React dedupes same-value setState).
        setSession(s)

        if (event === 'SIGNED_IN') {
          if (isSigningUp.current) {
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
        setIsLoading(false)
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
    isSigningUp.current = true
    try {
      await signUp({
        email: data.email, password: data.password, name: data.name,
        rrn: data.rrn ?? '', department: data.department ?? '',
        year: data.year ?? 1, phone: data.phone ?? '', role: data.role,
      })
    } finally {
      isSigningUp.current = false
    }
  }, [])

  const logout = useCallback(async () => {
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
