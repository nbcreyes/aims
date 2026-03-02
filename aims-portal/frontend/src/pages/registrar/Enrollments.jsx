import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  dropped: 'bg-gray-100 text-gray-500'
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState({ status: 'all', semesterId: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchSemesters = async () => {
    try {
      const res = await api.get('/semesters')
      setSemesters(res.data.data)
    } catch { }
  }

  const fetchEnrollments = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.status !== 'all') params.append('status', filter.status)
      if (filter.semesterId) params.append('semesterId', filter.semesterId)

      const res = await api.get(`/enrollments?${params.toString()}`)
      setEnrollments(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch enrollments')
    }
  }

  useEffect(() => { fetchSemesters() }, [])
  useEffect(() => { fetchEnrollments() }, [filter])

  const handleStatusUpdate = async (id, status) => {
    if (!confirm(`Set enrollment status to "${status}"?`)) return
    setLoading(true)
    try {
      await api.put(`/enrollments/${id}/status`, { status })
      fetchEnrollments()
      setSelected(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Enrollments</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filter.semesterId}
            onChange={(e) => setFilter({ ...filter, semesterId: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {semesters.map(s => (
              <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
            ))}
          </select>

          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected', 'dropped'].map(s => (
              <button
                key={s}
                onClick={() => setFilter({ ...filter, status: s })}
                className={`px-3 py-1.5 text-xs rounded-md font-medium border ${filter.status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Student', 'Program', 'Year Level', 'Semester', 'Subjects', 'Status', 'Enrolled', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400 text-sm">No enrollments found</td></tr>
              ) : enrollments.map(e => (
                <tr key={e._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{e.studentId?.name}</p>
                    <p className="text-xs text-gray-400">{e.studentId?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.programId?.code}</td>
                  <td className="px-4 py-3 text-gray-600">Year {e.yearLevel}</td>
                  <td className="px-4 py-3 text-gray-600">{e.semesterId?.schoolYear} {e.semesterId?.term}</td>
                  <td className="px-4 py-3 text-gray-600">{e.subjects?.length} subjects</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[e.status]}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(e.enrolledAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(e)} className="text-blue-600 hover:underline text-xs">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">
                Enrollment — {selected.studentId?.name}
              </h2>
              <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-gray-500">Program:</span> <span className="text-gray-800">{selected.programId?.name}</span></div>
              <div><span className="text-gray-500">Year Level:</span> <span className="text-gray-800">Year {selected.yearLevel}</span></div>
              <div><span className="text-gray-500">Semester:</span> <span className="text-gray-800">{selected.semesterId?.schoolYear} {selected.semesterId?.term}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Subjects</p>
              <div className="border border-gray-100 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Code', 'Subject', 'Units', 'Teacher', 'Schedule'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selected.subjects?.map(s => (
                      <tr key={s._id}>
                        <td className="px-3 py-2 text-gray-700">{s.subjectId?.code}</td>
                        <td className="px-3 py-2 text-gray-700">{s.subjectId?.name}</td>
                        <td className="px-3 py-2 text-gray-600">{s.subjectId?.units}</td>
                        <td className="px-3 py-2 text-gray-600">{s.teacherId?.name || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{s.day} {s.timeStart}–{s.timeEnd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selected.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(selected._id, 'approved')}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(selected._id, 'rejected')}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
            {selected.status === 'approved' && (
              <button
                onClick={() => handleStatusUpdate(selected._id, 'dropped')}
                disabled={loading}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 disabled:opacity-50"
              >
                Mark as Dropped
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}