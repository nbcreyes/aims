import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function TeacherAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/announcements')
        setAnnouncements(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load announcements')
      }
    }
    fetch()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Announcements</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        {announcements.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-40">
            <p className="text-sm text-gray-400">No announcements at this time</p>
          </div>
        )}

        <div className="space-y-3">
          {announcements.map(a => (
            <div
              key={a._id}
              className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors ${selected?._id === a._id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
              onClick={() => setSelected(selected?._id === a._id ? null : a)}
            >
              <p className="text-sm font-semibold text-gray-800">{a.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(a.createdAt).toLocaleDateString()} — by {a.createdBy?.name}
              </p>
              {selected?._id === a._id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}