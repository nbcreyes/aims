import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'
import useAuth from '../../hooks/useAuth'

const TERMS = ['prelim', 'midterm', 'finals']

export default function StudentGrades() {
  const { user } = useAuth()
  const [grades, setGrades] = useState([])
  const [incGrades, setIncGrades] = useState([])
  const [removalGrades, setRemovalGrades] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const semRes = await api.get('/semesters')
        setSemesters(semRes.data.data)
        const active = semRes.data.data.find(s => s.isActive)
        if (active) setSelectedSemester(active._id)
      } catch {}
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedSemester) return
    const fetch = async () => {
      setLoading(true)
      setError('')
      try {
        const [gradesRes, incRes, removalRes] = await Promise.all([
          api.get(`/grades/my?semesterId=${selectedSemester}`),
          api.get('/inc/my'),
          api.get('/removal/my')
        ])
        setGrades(gradesRes.data.data)
        setIncGrades(incRes.data.data)
        setRemovalGrades(removalRes.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load grades')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [selectedSemester])

  const getDaysLeft = (deadline) => {
    if (!deadline) return null
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">My Grades</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mb-5">
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

          {selectedSemester && grades.length > 0 && (
            <a
              href={`${import.meta.env.VITE_API_URL}/pdf/report-card/${user?._id}/${selectedSemester}`}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700"
            >
              Download Report Card
            </a>
          )}
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-40">
            <p className="text-sm text-gray-400">Loading grades...</p>
          </div>
        ) : (
          <>
            {/* ── Term Grades ── */}
            {grades.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-40">
                <p className="text-sm text-gray-400">No published grades found for this semester.</p>
              </div>
            ) : grades.map(item => (
              <div key={item.schedule._id} className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800">{item.subject?.name}</p>
                  <p className="text-xs text-gray-400">{item.subject?.code} — {item.subject?.units} units</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Term</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Class Standing</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Grade</th>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {TERMS.map(term => {
                      const g = item.terms[term]
                      return (
                        <tr key={term} className="hover:bg-gray-50">
                          <td className="px-4 py-3 capitalize font-medium text-gray-700">{term}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {g ? g.classStanding?.toFixed(2) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {g ? (
                              <span className={`font-semibold ${g.cumulativeGrade >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                {g.cumulativeGrade?.toFixed(2)}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {g ? (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                g.cumulativeGrade >= 75
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {g.cumulativeGrade >= 75 ? 'Passed' : 'Failed'}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">Not yet released</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}

            {/* ── INC Grades ── */}
            {incGrades.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  Incomplete (INC) Grades
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    {incGrades.filter(g => g.isINC).length} active
                  </span>
                </h2>
                <div className="bg-white border border-orange-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-orange-50 border-b border-orange-100">
                      <tr>
                        {['Subject', 'Semester', 'Reason', 'Deadline', 'Status'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-orange-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {incGrades.map(g => {
                        const daysLeft = getDaysLeft(g.incDeadline)
                        const isOverdue = daysLeft !== null && daysLeft < 0
                        const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14

                        return (
                          <tr key={g._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-mono text-xs font-medium text-gray-700">
                                {g.scheduleId?.subjectId?.code}
                              </p>
                              <p className="text-xs text-gray-400">{g.scheduleId?.subjectId?.name}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {g.semesterId?.schoolYear} {g.semesterId?.term}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                              {g.incReason || '—'}
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {g.incDeadline ? (
                                <div>
                                  <p className={
                                    isOverdue ? 'text-red-600 font-medium'
                                    : isUrgent ? 'text-orange-600 font-medium'
                                    : 'text-gray-600'
                                  }>
                                    {new Date(g.incDeadline).toLocaleDateString()}
                                  </p>
                                  {!g.incDefaulted && daysLeft !== null && (
                                    <p className={`mt-0.5 ${
                                      isOverdue ? 'text-red-500'
                                      : isUrgent ? 'text-orange-500'
                                      : 'text-gray-400'
                                    }`}>
                                      {isOverdue
                                        ? `${Math.abs(daysLeft)}d overdue`
                                        : daysLeft === 0
                                          ? 'Due today!'
                                          : `${daysLeft}d remaining`}
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
                                <div>
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                    Pending
                                  </span>
                                  <p className="text-xs text-gray-400 mt-1">Contact your teacher to resolve</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Removal Exams ── */}
            {removalGrades.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Removal Exams
                </h2>
                <div className="bg-white border border-yellow-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-yellow-50 border-b border-yellow-100">
                      <tr>
                        {['Subject', 'Semester', 'Original Grade', 'Removal Score', 'Result'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-yellow-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {removalGrades.map(g => (
                        <tr key={g._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs font-medium text-gray-700">
                              {g.scheduleId?.subjectId?.code}
                            </p>
                            <p className="text-xs text-gray-400">{g.scheduleId?.subjectId?.name}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {g.semesterId?.schoolYear} {g.semesterId?.term}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-red-600">
                              {g.cumulativeGrade?.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {g.removalExamScore !== undefined
                              ? `${g.removalExamScore} / ${g.removalExamTotal} (${g.removalExamGrade}%)`
                              : g.isEligibleForRemoval
                                ? <span className="text-blue-600">Exam not yet taken</span>
                                : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {g.isEligibleForRemoval ? (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                Eligible — Awaiting Exam
                              </span>
                            ) : g.removalPassed === true ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                Passed → Grade: 75
                              </span>
                            ) : g.removalPassed === false ? (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                Failed — Retake next semester
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}