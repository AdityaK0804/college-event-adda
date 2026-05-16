import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import type { UserRole } from '@/lib/database.types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
}

/**
 * ProtectedRoute — gates on auth session only, NEVER blocks forever.
 *
 * Design:
 * - `isLoading` (session hydration) is the ONLY hard gate.  It resolves in
 *   < 200 ms from localStorage.  If it somehow stalls, AuthContext's 3s
 *   safety timer forces it false.
 * - Role checks use the `user` shim (available instantly from session metadata)
 *   NOT the `profile` object (which requires a DB fetch).
 * - No internal timers, no local state, no useEffect — zero complexity.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // 1. Wait for session hydration (fast — localStorage read)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-eventx-purple border-t-transparent animate-spin" />
      </div>
    )
  }

  // 2. Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  // 3. Role check — uses user.role from the session metadata shim
  //    This is available INSTANTLY, no DB fetch needed.
  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(user.role as UserRole)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}
