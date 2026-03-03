import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function RemovalExams() {
  const [grades, setGrades] = useState([])
  const [students, setStudents] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Mark eligible modal
  const [eligibleModal, setEligibleModal] = useState(false)
  const [eligibleForm, setEligibleForm] = useState({ studentId: '', scheduleId: '' })
  const [eligibleLoading, setEligibleLoading] = useState(false)

  // Record exam modal
  const [recordModal, setRecordModal] = useState(null)
  const [recordForm, setRecordForm] = useState({ examScore: '', examTotal: 100 })
  const [recordLoading, setRecordLoading] = useState(false)

  // Student schedules for eligible modal
  const [studentSchedules, setStudentSchedules] = useState([])

  useEffect(() => {
    fetchData()
    fetchSemesters()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/removal')
      setGrades(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load removal exams')
    } finally {
      setLoading(false)
    }
  }

  const fetchSemesters = async () => {
    try {
      const res = await api.get('/semesters')
      setSemesters(res.data.data)
    } catch {}
  }

  const fetchStudentSchedules = async (studentId, semesterId) => {
    if (!studentId || !semesterId) return
    try {
      // Get failed finals grades for this student in this semester
      const res = await api.get(`/grades?studentId=${studentId}&semesterId=${semesterId}&term=finals`)
      const failed = res.data.data.filter(g =>
        g.cumulativeGrade < 75 && !g.isINC && !g.incDefaulted && !g.isEligibleForRemoval && g.removalExamScore === undefined
      )
      setStudentSchedules(failed)
    } catch {}
  }

  const handleMarkEligible = async () => {
    if (!eligibleForm.studentId || !eligibleForm.scheduleId) {
      setError('Please select a student and subject')
      return
    }
    setEligibleLoading(true)
    setError('')
    try {
      await api.post('/removal/eligible', {
        studentId: eligibleForm.studentId,
        scheduleId: eligibleForm.scheduleId
      })
      setSuccess('Student marked eligible for removal exam')
      setEligibleModal(false)
      setEligibleForm({ studentId: '', scheduleId: '' })
      setStudentSchedules([])
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark eligible')
    } finally {
      setEligibleLoading(false)
    }
  }

  const handleRecordExam = async () => {
    if (!recordForm.examScore || !recordForm.examTotal) {
      setError('Please enter exam score and total')
      return
    }
    setRecordLoading(true)
    setError('')
    try {
      await api.post('/removal/record', {
        studentId: recordModal.studentId,
        scheduleId: recordModal.scheduleId,
        examScore: parseFloat(recordForm.examScore),
        examTotal: parseFloat(recordForm.examTotal)
      })
      setSuccess(`Removal exam recorded for ${recordModal.studentName}`)
      setRecordModal(null)
      setRecordForm({ examScore: '', examTotal: 100 })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record exam')
    } finally {
      setRecordLoading(false)
    }
  }

  const filtered = grades.filter(g => {
    const matchSearch =
      g.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.scheduleId?.subjectId?.code?.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'eligible' && g.isEligibleForRemoval) ||
      (filterStatus === 'passed' && g.removalPassed === true) ||
      (filterStatus === 'failed' && g.removalPassed === false)
    return matchSearch && matchStatus
  })

  const examPercent = recordForm.examScore && recordForm.examTotal
    ? ((parseFloat(recordForm.examScore) / parseFloat(recordForm.examTotal)) * 100).toFixed(2)
    : null

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Removal Exams</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage removal exam eligibility and results</p>
          </div>
          <button
            onClick={() => { setEligibleModal(true); setError('') }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            + Mark Eligible
          </button>
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

        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by student or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="eligible">Eligible (Pending)</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 text-center">
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 text-center">
            <p className="text-sm text-gray-400">No removal exam records found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Student', 'Subject', 'Semester', 'Original Grade', 'Removal Score', 'Result', 'Administered By', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(g => (
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
                      {g.semesterId?.schoolYear}<br />{g.semesterId?.term}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-red-600">
                        {g.cumulativeGrade?.toFixed(2)}%
                      </span>
                      <p className="text-xs text-gray-400">Failed</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {g.removalExamScore !== undefined
                        ? `${g.removalExamScore} / ${g.removalExamTotal} (${g.removalExamGrade}%)`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {g.isEligibleForRemoval ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          Eligible — Pending
                        </span>
                      ) : g.removalPassed === true ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          Passed → 75
                        </span>
                      ) : g.removalPassed === false ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                          Failed — Retake
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {g.removalAdministeredBy?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {g.isEligibleForRemoval && (
                        <button
                          onClick={() => {
                            setRecordModal({
                              studentId: g.studentId?._id,
                              studentName: g.studentId?.name,
                              scheduleId: g.scheduleId?._id,
                              subjectCode: g.scheduleId?.subjectId?.code,
                              originalGrade: g.cumulativeGrade
                            })
                            setRecordForm({ examScore: '', examTotal: 100 })
                            setError('')
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Record Exam
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Eligible Modal */}
      {eligibleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Mark Eligible for Removal Exam</h2>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Student ID</label>
              <input
                type="text"
                placeholder="Paste student _id from MongoDB or search"
                value={eligibleForm.studentId}
                onChange={e => {
                  setEligibleForm({ ...eligibleForm, studentId: e.target.value, scheduleId: '' })
                  setStudentSchedules([])
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
              <select
                onChange={e => fetchStudentSchedules(eligibleForm.studentId, e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select semester to load failed subjects</option>
                {semesters.map(s => (
                  <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
                ))}
              </select>
            </div>

            {studentSchedules.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Failed Subject</label>
                <select
                  value={eligibleForm.scheduleId}
                  onChange={e => setEligibleForm({ ...eligibleForm, scheduleId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select subject</option>
                  {studentSchedules.map(g => (
                    <option key={g.scheduleId} value={g.scheduleId}>
                      {g.scheduleId?.subjectId?.code} — {g.cumulativeGrade?.toFixed(2)}%
                    </option>
                  ))}
                </select>
              </div>
            )}

            {studentSchedules.length === 0 && eligibleForm.studentId && (
              <p className="text-xs text-gray-400 mb-4">
                Select a semester above to load the student's failed subjects.
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setEligibleModal(false); setStudentSchedules([]) }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkEligible}
                disabled={eligibleLoading || !eligibleForm.studentId || !eligibleForm.scheduleId}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {eligibleLoading ? 'Saving...' : 'Mark Eligible'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Exam Modal */}
      {recordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">Record Removal Exam</h2>
            <p className="text-sm text-gray-500 mb-1">{recordModal.studentName}</p>
            <p className="text-xs text-gray-400 mb-1">Subject: {recordModal.subjectCode}</p>
            <p className="text-xs text-red-500 mb-4">
              Original grade: {recordModal.originalGrade?.toFixed(2)}% (Failed)
            </p>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Score</label>
                <input
                  type="number"
                  min={0}
                  value={recordForm.examScore}
                  onChange={e => setRecordForm({ ...recordForm, examScore: e.target.value })}
                  placeholder="e.g. 80"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-gray-400 mt-5">/</span>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                <input
                  type="number"
                  min={1}
                  value={recordForm.examTotal}
                  onChange={e => setRecordForm({ ...recordForm, examTotal: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {examPercent !== null && (
              <div className={`text-sm font-medium mb-4 px-3 py-2 rounded-md ${
                parseFloat(examPercent) >= 75
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {examPercent}% — {parseFloat(examPercent) >= 75 ? '✓ Will PASS (grade → 75)' : '✗ Will FAIL (must retake)'}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRecordModal(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordExam}
                disabled={recordLoading || !recordForm.examScore}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {recordLoading ? 'Saving...' : 'Record Result'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}