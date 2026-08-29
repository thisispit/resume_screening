import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children, roles }) {
  const { authenticated, user } = useAuth()
  if (!authenticated) return <Navigate to="/login" replace />
  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default ProtectedRoute
