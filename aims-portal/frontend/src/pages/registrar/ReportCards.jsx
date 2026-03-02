import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const TERMS = ['prelim', 'midterm', 'finals']

export default function ReportCards() {
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [grades, setGrades] = useState([])
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const [semRes, stuRes] = await Promise.all([
          api.get('/semesters'),
          api.get('/students')
        ])
        setSemesters(semRes.data.data)
        setStudents(stuRes.data.data)
        const active = semRes.data.data.find(s => s.isActive)
        if (active) setSelectedSemester(active._id)
      } catch (err) {
        setError('Failed to load data')
      }
    }
    init()
  }, [])

  const handleSelectStudent = async (student) => {
    if (!selectedSemester) {
      setError('Please select a semester first')
      return
    }
    setSelectedStudent(student)
    setGrades([])
    setLoadingGrades(true)
    setError('')

    try {
      const res = await api.get(
        `/grades?studentId=${student.user._id}&semesterId=${selectedSemester}`
      )
      const raw = res.data.data

      // Group by scheduleId
      const grouped = {}
      for (const g of raw) {
        const key = g.scheduleId?._id?.toString()
        if (!key) continue
        if (!grouped[key]) {
          grouped[key] = {
            schedule: g.scheduleId,
            subject: g.scheduleId?.subjectId,
            terms: {}
          }
        }
        grouped[key].terms[g.term] = g
      }
      setGrades(Object.values(grouped))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load grades')
    } finally {
      setLoadingGrades(false)
    }
  }

  const filtered = students.filter(s =>
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.record?.studentNo?.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnits = grades.reduce((sum, g) => sum + (g.subject?.units || 0), 0)
  const earnedUnits = grades
    .filter(g => (g.terms['finals']?.cumulativeGrade || 0) >= 75)
    .reduce((sum, g) => sum + (g.subject?.units || 0), 0)

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Report Cards</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-6">
          {/* Left — Student List */}
          <div className="w-72 flex-shrink-0">
            <select
              value={selectedSemester}
              onChange={(e) => { setSelectedSemester(e.target.value); setSelectedStudent(null); setGrades([]) }}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select semester</option>
              {semesters.map(s => (
                <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">No students found</p>
              ) : filtered.map(s => (
                <button
                  key={s.user._id}
                  onClick={() => handleSelectStudent(s)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${selectedStudent?.user._id === s.user._id ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-800">{s.user.name}</p>
                  <p className="text-xs text-gray-400">{s.record?.studentNo}</p>
                  <p className="text-xs text-gray-400">{s.record?.programId?.code} — Year {s.record?.yearLevel}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right — Report Card */}
          <div className="flex-1">
            {!selectedStudent && (
              <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-48">
                <p className="text-sm text-gray-400">Select a student to view their report card</p>
              </div>
            )}

            {selectedStudent && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Student Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-bold text-gray-800">{selectedStudent.user.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedStudent.record?.studentNo} — {selectedStudent.record?.programId?.name} — Year {selectedStudent.record?.yearLevel}
                      </p>
                    </div>
                    {selectedSemester && grades.length > 0 && (
                      <a
                        href={`${import.meta.env.VITE_API_URL}/pdf/report-card/${selectedStudent.user._id}/${selectedSemester}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700"
                      >
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>

                {loadingGrades ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-gray-400">Loading grades...</p>
                  </div>
                ) : grades.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-gray-400">No grades found for this semester.</p>
                    <p className="text-xs text-gray-300 mt-1">Grades may not be published yet.</p>
                  </div>
                ) : (
                  <div className="p-6">
                    <table className="w-full text-sm mb-6">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Code</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Subject</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Units</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Prelim</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Midterm</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Finals</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {grades.map((item, i) => {
                          const finals = item.terms['finals']
                          const finalGrade = finals?.cumulativeGrade
                          const passed = finalGrade !== null && finalGrade !== undefined && finalGrade >= 75

                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-3 font-mono text-xs text-gray-700">{item.subject?.code || '—'}</td>
                              <td className="px-3 py-3 text-gray-800">{item.subject?.name || '—'}</td>
                              <td className="px-3 py-3 text-gray-600">{item.subject?.units || '—'}</td>
                              {TERMS.map(term => {
                                const g = item.terms[term]
                                return (
                                  <td key={term} className="px-3 py-3">
                                    {g ? (
                                      <span className={`font-medium ${g.cumulativeGrade >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                        {g.cumulativeGrade?.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300 text-xs">—</span>
                                    )}
                                  </td>
                                )
                              })}
                              <td className="px-3 py-3">
                                {finalGrade !== undefined && finalGrade !== null ? (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {passed ? 'Passed' : 'Failed'}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-300">Pending</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {/* Unit Summary */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Total Units Enrolled', value: totalUnits, color: 'text-gray-800' },
                        { label: 'Units Earned', value: earnedUnits, color: 'text-green-600' },
                        { label: 'Units Failed', value: totalUnits - earnedUnits, color: 'text-red-600' }
                      ].map(item => (
                        <div key={item.label} className="bg-gray-50 rounded-md p-3">
                          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}