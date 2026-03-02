import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function StudentEnrollment() {
  const [activeSemester, setActiveSemester] = useState(null)
  const [myEnrollment, setMyEnrollment] = useState(null)
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const semRes = await api.get('/semesters/active')
        const sem = semRes.data.data
        setActiveSemester(sem)

        const enrollRes = await api.get(`/enrollments/my?semesterId=${sem._id}`)
        if (enrollRes.data.data) {
          setMyEnrollment(enrollRes.data.data)
          return
        }

        const subRes = await api.get(`/enrollments/available-subjects?semesterId=${sem._id}`)
        setAvailableSubjects(subRes.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load enrollment data')
      }
    }
    init()
  }, [])

  const toggleSubject = (scheduleId) => {
    setSelectedSubjects(prev =>
      prev.includes(scheduleId) ? prev.filter(id => id !== scheduleId) : [...prev, scheduleId]
    )
  }

  const handleSubmit = async () => {
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('/enrollments', {
        semesterId: activeSemester._id,
        subjects: selectedSubjects
      })
      setSuccess('Enrollment submitted. Awaiting registrar approval.')
      const enrollRes = await api.get(`/enrollments/my?semesterId=${activeSemester._id}`)
      setMyEnrollment(enrollRes.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed')
    } finally {
      setLoading(false)
    }
  }

  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    dropped: 'bg-gray-100 text-gray-500'
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Enrollment</h1>

        {!activeSemester && !error && (
          <p className="text-sm text-gray-500">No active semester at this time.</p>
        )}

        {activeSemester && (
          <p className="text-sm text-gray-500 mb-6">
            Active Semester: <span className="font-medium text-gray-700">{activeSemester.schoolYear} — {activeSemester.term}</span>
          </p>
        )}

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        {/* Already enrolled */}
        {myEnrollment && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-sm font-medium text-gray-700">Enrollment Status:</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[myEnrollment.status]}`}>
                {myEnrollment.status}
              </span>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Code', 'Subject', 'Units', 'Teacher', 'Day', 'Time', 'Room'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myEnrollment.subjects?.map(s => (
                    <tr key={s._id}>
                      <td className="px-4 py-3 text-gray-700">{s.subjectId?.code}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{s.subjectId?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.subjectId?.units}</td>
                      <td className="px-4 py-3 text-gray-600">{s.teacherId?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.day}</td>
                      <td className="px-4 py-3 text-gray-600">{s.timeStart} – {s.timeEnd}</td>
                      <td className="px-4 py-3 text-gray-600">{s.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Not yet enrolled */}
        {!myEnrollment && activeSemester && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Select your subjects for this semester:</p>

            {availableSubjects.length === 0 ? (
              <p className="text-sm text-gray-400">No available subjects found for your program and year level.</p>
            ) : (
              <>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3"></th>
                        {['Code', 'Subject', 'Units', 'Teacher', 'Day', 'Time', 'Room'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {availableSubjects.map(s => (
                        <tr
                          key={s._id}
                          className={`hover:bg-gray-50 cursor-pointer ${selectedSubjects.includes(s._id) ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleSubject(s._id)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedSubjects.includes(s._id)}
                              onChange={() => toggleSubject(s._id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-700">{s.subjectId?.code}</td>
                          <td className="px-4 py-3 text-gray-800 font-medium">{s.subjectId?.name}</td>
                          <td className="px-4 py-3 text-gray-600">{s.subjectId?.units}</td>
                          <td className="px-4 py-3 text-gray-600">{s.teacherId?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{s.day}</td>
                          <td className="px-4 py-3 text-gray-600">{s.timeStart} – {s.timeEnd}</td>
                          <td className="px-4 py-3 text-gray-600">{s.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-600">
                    {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || selectedSubjects.length === 0}
                    className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Enrollment'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}