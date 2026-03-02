import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const ROLE_HOME = {
  superadmin: '/superadmin/dashboard',
  registrar: '/registrar/dashboard',
  cashier: '/cashier/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  parent: '/parent/dashboard'
}

export default function NotFound() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const home = user ? ROLE_HOME[user.role] : '/login'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <p className="text-lg font-semibold text-gray-700 mb-2">Page not found</p>
        <p className="text-sm text-gray-400 mb-6">
          This page doesn't exist or you don't have access to it.
        </p>
        <button
          onClick={() => navigate(home)}
          className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}