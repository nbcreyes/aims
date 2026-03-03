import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function INCGrades() {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDefaulted, setShowDefaulted] = useState(false)
  const [resolveModal, setResolveModal] = useState(null)
  const [resolveGrade, setResolveGrade] = useState('')
  const [resolveLoading, setResolveLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchINC()
  }, [showDefaulted])

  const fetchINC = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (showDefaulted) params.append('includeDefaulted', 'true')
      const res = await api.get(`/inc?${params}`)
      setGrades(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load INC grades')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!resolveGrade || isNaN(resolveGrade)) {
      setError('Please enter a valid grade')
      return
    }
    setResolveLoading(true)
    setError('')
    try {
      await api.post('/inc/resolve', {
        studentId: resolveModal.studentId,
        scheduleId: resolveModal.scheduleId,
        resolvedGrade: parseFloat(resolveGrade)
      })
      setSuccess(`INC resolved for ${resolveModal.studentName}`)
      setResolveModal(null)
      setResolveGrade('')
      fetchINC()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve INC')
    } finally {
      setResolveLoading(false)
    }
  }

  const getDaysLeft = (deadline) => {
    if (!deadline) return null
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const filtered = grades.filter(g =>
    g.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.scheduleId?.subjectId?.code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">INC Grades</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Incomplete grades awaiting resolution
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showDefaulted}
              onChange={e => setShowDefaulted(e.target.checked)}
              className="rounded"
            />
            Show defaulted
          </label>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">
            {success}
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by student name or subject code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 text-center">
            <p className="text-sm text-gray-400">Loading INC grades...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 text-center">
            <p className="text-sm text-gray-400">No INC grades found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Student', 'Subject', 'Semester', 'Reason', 'Deadline', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(g => {
                  const daysLeft = getDaysLeft(g.incDeadline)
                  const isOverdue = daysLeft !== null && daysLeft < 0
                  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14

                  return (
                    <tr key={g._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{g.studentId?.name}</p>
                        <p className="text-xs text-gray-400">{g.studentId?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-medium text-gray-700">
                          {g.scheduleId?.subjectId?.code}
                        </p>
                        <p className="text-xs text-gray-400">{g.scheduleId?.subjectId?.name}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {g.semesterId?.schoolYear}<br />
                        {g.semesterId?.term}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-48">
                        {g.incReason || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {g.incDeadline ? (
                          <div>
                            <p className={isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                              {new Date(g.incDeadline).toLocaleDateString()}
                            </p>
                            {!g.incDefaulted && (
                              <p className={`mt-0.5 ${isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-gray-400'}`}>
                                {isOverdue
                                  ? `${Math.abs(daysLeft)}d overdue`
                                  : daysLeft === 0
                                    ? 'Due today'
                                    : `${daysLeft}d left`}
                              </p>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {g.incDefaulted ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                            Defaulted (5.0)
                          </span>
                        ) : g.incResolvedAt ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            Resolved — {g.incResolvedGrade}%
                          </span>
                        ) : (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!g.incDefaulted && !g.incResolvedAt && (
                          <button
                            onClick={() => setResolveModal({
                              studentId: g.studentId?._id,
                              studentName: g.studentId?.name,
                              scheduleId: g.scheduleId?._id,
                              subjectCode: g.scheduleId?.subjectId?.code
                            })}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">Resolve INC</h2>
            <p className="text-sm text-gray-500 mb-1">{resolveModal.studentName}</p>
            <p className="text-xs text-gray-400 mb-4">Subject: {resolveModal.subjectCode}</p>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Final Grade (0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={resolveGrade}
                onChange={e => setResolveGrade(e.target.value)}
                placeholder="e.g. 78"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {resolveGrade && (
                <p className={`text-xs mt-1 ${parseFloat(resolveGrade) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(resolveGrade) >= 75 ? '✓ Passing' : '✗ Failing'}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setResolveModal(null); setResolveGrade('') }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={resolveLoading || !resolveGrade}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {resolveLoading ? 'Saving...' : 'Resolve INC'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}