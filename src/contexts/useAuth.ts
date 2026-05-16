// useAuth is in its own file so Vite's react-swc Fast Refresh can distinguish
// between the AuthProvider component (AuthContext.tsx) and this plain hook.
import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
