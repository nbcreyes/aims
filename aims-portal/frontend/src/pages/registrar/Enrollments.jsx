import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/semesters').then(res => {
      setSemesters(res.data.data)
      const active = res.data.data.find(s => s.isActive)
      if (active) setSelectedSemester(active._id)
    })
  }, [])

  useEffect(() => {
    if (selectedSemester) fetchEnrollments()
  }, [selectedSemester, filterStatus])

  const fetchEnrollments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ semesterId: selectedSemester })
      if (filterStatus !== 'all') params.append('status', filterStatus)
      const res = await api.get(`/enrollments?${params}`)
      setEnrollments(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch enrollments')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, status) => {
    try {
      await api.put(`/enrollments/${id}`, { status })
      setSuccess(`Enrollment ${status}`)
      fetchEnrollments()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update enrollment')
    }
  }

  const handleBulkApprove = async () => {
    const pendingIds = enrollments
      .filter(e => e.status === 'pending')
      .map(e => e._id)

    if (!pendingIds.length) {
      setError('No pending enrollments to approve')
      return
    }

    if (!confirm(`Approve all ${pendingIds.length} pending enrollments?`)) return

    try {
      await api.put('/enrollments/bulk', { enrollmentIds: pendingIds, status: 'approved' })
      setSuccess(`${pendingIds.length} enrollments approved`)
      fetchEnrollments()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to bulk approve')
    }
  }

  const filtered = enrollments.filter(e =>
    e.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.scheduleId?.subjectId?.code?.toLowerCase().includes(search.toLowerCase())
  )

  // Group by student
  const grouped = filtered.reduce((acc, e) => {
    const key = e.studentId?._id
    if (!acc[key]) {
      acc[key] = { student: e.studentId, enrollments: [] }
    }
    acc[key].enrollments.push(e)
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Enrollments</h1>
          {filterStatus === 'pending' && (
            <button
              onClick={handleBulkApprove}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
            >
              Approve All Pending
            </button>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select semester</option>
            {semesters.map(s => (
              <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="dropped">Dropped</option>
          </select>

          <input
            type="text"
            placeholder="Search student or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 text-center">
            <p className="text-sm text-gray-400">Loading enrollments...</p>
          </div>
        ) : Object.values(grouped).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 text-center">
            <p className="text-sm text-gray-400">No enrollments found</p>
          </div>
        ) : Object.values(grouped).map(({ student, enrollments: studentEnrollments }) => (
          <div key={student?._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{student?.name}</p>
                <p className="text-xs text-gray-400">{student?.email}</p>
              </div>
              <p className="text-xs text-gray-500">{studentEnrollments.length} subject(s)</p>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Subject', 'Section', 'Teacher', 'Schedule', 'Units', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {studentEnrollments.map(e => (
                  <tr key={e._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{e.scheduleId?.subjectId?.code}</p>
                      <p className="text-xs text-gray-400">{e.scheduleId?.subjectId?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{e.scheduleId?.sectionId?.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{e.scheduleId?.teacherId?.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <p>{e.scheduleId?.day}</p>
                      <p>{e.scheduleId?.timeStart} — {e.scheduleId?.timeEnd}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 text-center">
                      {e.scheduleId?.subjectId?.units}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        e.status === 'approved' ? 'bg-green-100 text-green-700' :
                        e.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        e.status === 'dropped' ? 'bg-gray-100 text-gray-500' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      {e.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(e._id, 'approved')}
                            className="text-green-600 hover:underline text-xs">Approve</button>
                          <button onClick={() => handleAction(e._id, 'rejected')}
                            className="text-red-600 hover:underline text-xs">Reject</button>
                        </>
                      )}
                      {e.status === 'approved' && (
                        <button onClick={() => handleAction(e._id, 'dropped')}
                          className="text-orange-600 hover:underline text-xs">Drop</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}