import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'
import useAuth from '../../hooks/useAuth'

export default function ParentDashboard() {
  const { user } = useAuth()
  const [children, setChildren] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/parent/children')
        setChildren(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load children')
      }
    }
    fetch()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-400 mb-6">Parent Portal</p>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <h2 className="text-sm font-semibold text-gray-700 mb-3">My Children</h2>

        {children.length === 0 ? (
          <p className="text-sm text-gray-400">No children linked to your account yet. Please contact the registrar.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {children.map(c => (
              <div key={c.user._id} className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-800">{c.user.name}</p>
                <p className="text-xs text-gray-400 mb-2">{c.user.email}</p>
                <p className="text-xs text-gray-600">
                  {c.record?.programId?.name} — Year {c.record?.yearLevel}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-1">{c.record?.studentNo}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}