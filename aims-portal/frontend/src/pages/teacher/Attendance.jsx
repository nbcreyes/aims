import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const STATUS_OPTIONS = ['present', 'absent', 'late']

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700'
}

export default function TeacherAttendance() {
  const [schedules, setSchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [view, setView] = useState('list') // list | new | edit
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const semRes = await api.get('/semesters')
        setSemesters(semRes.data.data)
        const active = semRes.data.data.find(s => s.isActive)
        if (active) setSelectedSemester(active._id)
      } catch { }
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedSemester) return
    const fetch = async () => {
      try {
        const res = await api.get(`/schedules/my?semesterId=${selectedSemester}`)
        setSchedules(res.data.data)
      } catch { }
    }
    fetch()
  }, [selectedSemester])

  const fetchSessions = async (scheduleId) => {
    try {
      const res = await api.get(`/attendance?scheduleId=${scheduleId}`)
      setSessions(res.data.data)
    } catch { }
  }

  const handleSelectSchedule = async (schedule) => {
    setSelectedSchedule(schedule)
    setSelectedSession(null)
    setView('list')
    setError('')
    setSuccess('')
    await fetchSessions(schedule._id)
  }

  const handleNewSession = async () => {
    setError('')
    setSuccess('')
    try {
      const res = await api.get(`/attendance/students?scheduleId=${selectedSchedule._id}`)
      const studentList = res.data.data
      setStudents(studentList)
      setRecords(studentList.map(s => ({ studentId: s._id, status: 'present' })))
      setDate(new Date().toISOString().slice(0, 10))
      setView('new')
    } catch (err) {
      setError('Failed to load students')
    }
  }

  const handleEditSession = async (session) => {
    setSelectedSession(session)
    const populated = await api.get(`/attendance/${session._id}`)
    const s = populated.data.data
    setRecords(s.records.map(r => ({ studentId: r.studentId._id, status: r.status })))
    setStudents(s.records.map(r => r.studentId))
    setDate(new Date(s.date).toISOString().slice(0, 10))
    setView('edit')
    setError('')
    setSuccess('')
  }

  const handleStatusChange = (studentId, status) => {
    setRecords(prev => prev.map(r =>
      r.studentId === studentId ? { ...r, status } : r
    ))
  }

  const handleSubmitNew = async () => {
    setLoading(true)
    setError('')
    try {
      await api.post('/attendance', {
        scheduleId: selectedSchedule._id,
        date,
        records
      })
      setSuccess('Attendance saved')
      setView('list')
      await fetchSessions(selectedSchedule._id)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEdit = async () => {
    setLoading(true)
    setError('')
    try {
      await api.put(`/attendance/${selectedSession._id}`, { records })
      setSuccess('Attendance updated')
      setView('list')
      await fetchSessions(selectedSchedule._id)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sessionId) => {
    if (!confirm('Delete this attendance session?')) return
    try {
      await api.delete(`/attendance/${sessionId}`)
      await fetchSessions(selectedSchedule._id)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete session')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Attendance</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        <div className="flex gap-6">
          {/* Left — Class List */}
          <div className="w-72 flex-shrink-0">
            <div className="mb-3">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select semester</option>
                {semesters.map(s => (
                  <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
                ))}
              </select>
            </div>

            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">My Classes</p>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {schedules.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">No classes found</p>
              ) : schedules.map(s => (
                <button
                  key={s._id}
                  onClick={() => handleSelectSchedule(s)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedSchedule?._id === s._id ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-800">{s.subjectId?.name}</p>
                  <p className="text-xs text-gray-400">{s.sectionId?.name} — {s.day} {s.timeStart}–{s.timeEnd}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right — Sessions / Form */}
          <div className="flex-1">
            {!selectedSchedule && (
              <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-48">
                <p className="text-sm text-gray-400">Select a class to manage attendance</p>
              </div>
            )}

            {selectedSchedule && view === 'list' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-base font-semibold text-gray-800">{selectedSchedule.subjectId?.name}</p>
                    <p className="text-xs text-gray-400">{selectedSchedule.sectionId?.name} — {selectedSchedule.day} {selectedSchedule.timeStart}–{selectedSchedule.timeEnd} — {selectedSchedule.room}</p>
                  </div>
                  <button
                    onClick={handleNewSession}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    New Session
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Date', 'Present', 'Late', 'Absent', 'Total', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sessions.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">No sessions yet</td></tr>
                      ) : sessions.map(session => {
                        const present = session.records.filter(r => r.status === 'present').length
                        const late = session.records.filter(r => r.status === 'late').length
                        const absent = session.records.filter(r => r.status === 'absent').length
                        return (
                          <tr key={session._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {new Date(session.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-green-600 font-medium">{present}</td>
                            <td className="px-4 py-3 text-yellow-600 font-medium">{late}</td>
                            <td className="px-4 py-3 text-red-600 font-medium">{absent}</td>
                            <td className="px-4 py-3 text-gray-600">{session.records.length}</td>
                            <td className="px-4 py-3 space-x-2">
                              <button onClick={() => handleEditSession(session)} className="text-blue-600 hover:underline text-xs">Edit</button>
                              <button onClick={() => handleDelete(session._id)} className="text-red-600 hover:underline text-xs">Delete</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedSchedule && (view === 'new' || view === 'edit') && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">
                    {view === 'new' ? 'New Attendance Session' : 'Edit Attendance Session'}
                  </h2>
                  <button onClick={() => { setView('list'); setError('') }} className="text-xs text-gray-400 hover:text-gray-600">
                    Cancel
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {students.length === 0 ? (
                  <p className="text-sm text-gray-400">No enrolled students found for this class.</p>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => setRecords(records.map(r => ({ ...r, status: s })))}
                          className={`px-3 py-1 text-xs rounded-md border font-medium ${STATUS_COLORS[s]} border-current`}
                        >
                          Mark all {s}
                        </button>
                      ))}
                    </div>

                    <div className="border border-gray-100 rounded-md overflow-hidden mb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Student</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {students.map((student, i) => {
                            const rec = records.find(r => r.studentId === student._id || r.studentId === student._id?.toString())
                            return (
                              <tr key={student._id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-800">{student.name}</td>
                                <td className="px-4 py-2">
                                  <div className="flex gap-2">
                                    {STATUS_OPTIONS.map(s => (
                                      <button
                                        key={s}
                                        onClick={() => handleStatusChange(student._id, s)}
                                        className={`px-3 py-1 text-xs rounded-md font-medium border transition-colors ${rec?.status === s ? STATUS_COLORS[s] + ' border-current' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                      >
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={view === 'new' ? handleSubmitNew : handleSubmitEdit}
                      disabled={loading}
                      className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Attendance'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}