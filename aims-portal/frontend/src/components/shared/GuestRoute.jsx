import { Navigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const ROLE_HOME = {
  superadmin: '/superadmin/dashboard',
  registrar: '/registrar/dashboard',
  cashier: '/cashier/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  parent: '/parent/dashboard'
}

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
  }

  return children
}