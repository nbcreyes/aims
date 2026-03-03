import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const TERMS = ['prelim', 'midterm', 'finals']

export default function Transcript() {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [transcript, setTranscript] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/students')
        setStudents(res.data.data)
      } catch {}
    }
    init()
  }, [])

  const fetchTranscript = async (studentId) => {
    setLoading(true)
    setError('')
    setTranscript(null)
    try {
      const res = await api.get(`/students/${studentId}/transcript`)
      setTranscript(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transcript')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectStudent = (s) => {
    setSelectedStudent(s)
    fetchTranscript(s.user._id)
  }

  const filtered = students.filter(s =>
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.record?.studentNo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Transcript of Records</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-6">
          {/* Student List */}
          <div className="w-72 flex-shrink-0">
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No students found</p>
              ) : filtered.map(s => (
                <button
                  key={s.user._id}
                  onClick={() => handleSelectStudent(s)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedStudent?.user._id === s.user._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800">{s.user.name}</p>
                  <p className="text-xs text-gray-400">{s.record?.studentNo} — {s.record?.programId?.code}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Transcript Panel */}
          <div className="flex-1 min-w-0">
            {!selectedStudent ? (
              <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-48">
                <p className="text-sm text-gray-400">Select a student to view their transcript</p>
              </div>
            ) : loading ? (
              <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-48">
                <p className="text-sm text-gray-400">Loading transcript...</p>
              </div>
            ) : transcript ? (
              <>
                {/* Student Header */}
                <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-800">{transcript.student.name}</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {transcript.record?.studentNo} — {transcript.record?.programId?.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Year {transcript.record?.yearLevel}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-700">
                        {transcript.overallGWA?.toFixed(4) ?? '—'}
                      </div>
                      <div className="text-xs text-gray-400">Overall GWA</div>
                      <div className="text-sm font-semibold text-green-600 mt-1">
                        {transcript.totalUnitsEarned} units earned
                      </div>
                      <a
                        href={`${import.meta.env.VITE_API_URL}/pdf/tor/${transcript.student._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700"
                      >
                        Download TOR PDF
                      </a>
                    </div>
                  </div>
                </div>

                {/* Semester Blocks */}
                {transcript.semesters.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-400">No grade records found</p>
                  </div>
                ) : transcript.semesters.map((item, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden">
                    <div className="bg-slate-700 text-white px-4 py-2.5 flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {item.semester?.schoolYear} — {item.semester?.term}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <span>Sem GWA: <strong>{item.semesterGWA?.toFixed(4) ?? '—'}</strong></span>
                        <span>Units Earned: <strong>{item.totalUnits}</strong></span>
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Code</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Subject</th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Units</th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Prelim</th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Midterm</th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Finals</th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {item.subjects.map((sub, si) => {
                          const finals = sub.terms['finals']
                          const finalGrade = finals?.cumulativeGrade ?? null
                          const passed = finalGrade !== null && finalGrade >= 75

                          let gradeDisplay = '—'
                          let remarks = <span className="text-xs text-gray-300">Pending</span>

                          if (finals?.incDefaulted) {
                            gradeDisplay = '5.0'
                            remarks = <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">INC Default</span>
                          } else if (finals?.isINC) {
                            gradeDisplay = 'INC'
                            remarks = <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Incomplete</span>
                          } else if (finals?.removalPassed === true) {
                            gradeDisplay = '75.00'
                            remarks = <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Passed (Removal)</span>
                          } else if (finals?.removalPassed === false) {
                            gradeDisplay = finalGrade?.toFixed(2)
                            remarks = <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Failed — Retake</span>
                          } else if (finalGrade !== null) {
                            gradeDisplay = finalGrade.toFixed(2)
                            remarks = passed
                              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Passed</span>
                              : <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Failed</span>
                          }

                          return (
                            <tr key={si} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{sub.subject?.code || '—'}</td>
                              <td className="px-4 py-2.5 text-gray-700">{sub.subject?.name || '—'}</td>
                              <td className="px-4 py-2.5 text-center text-gray-600">{sub.subject?.units || '—'}</td>
                              <td className="px-4 py-2.5 text-center text-gray-500">
                                {sub.terms['prelim']?.cumulativeGrade?.toFixed(2) || '—'}
                              </td>
                              <td className="px-4 py-2.5 text-center text-gray-500">
                                {sub.terms['midterm']?.cumulativeGrade?.toFixed(2) || '—'}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`font-semibold text-sm ${
                                  finals?.isINC ? 'text-orange-600'
                                  : finalGrade !== null ? (passed ? 'text-green-600' : 'text-red-600')
                                  : 'text-gray-400'
                                }`}>
                                  {gradeDisplay}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center">{remarks}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}