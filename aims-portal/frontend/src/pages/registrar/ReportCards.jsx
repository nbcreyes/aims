import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const TERMS = ['prelim', 'midterm', 'finals']

export default function ReportCards() {
  const [students, setStudents] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [grades, setGrades] = useState([])
  const [search, setSearch] = useState('')
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
      } catch { }
    }
    init()
  }, [])

  const fetchGrades = async (studentId, semesterId) => {
    setError('')
    try {
      const res = await api.get(`/grades?scheduleId=all&semesterId=${semesterId}&studentId=${studentId}`)
      setGrades(res.data.data)
    } catch (err) {
      setError('Failed to load grades')
    }
  }

  const handleSelectStudent = (s) => {
    setSelectedStudent(s)
    if (selectedSemester) fetchGrades(s.user._id, selectedSemester)
  }

  const filtered = students.filter(s =>
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.record?.studentNo?.toLowerCase().includes(search.toLowerCase())
  )

  // Group grades by schedule
  const grouped = {}
  for (const g of grades) {
    const key = g.scheduleId?._id?.toString()
    if (!key) continue
    if (!grouped[key]) {
      grouped[key] = {
        schedule: g.scheduleId,
        terms: {}
      }
    }
    grouped[key].terms[g.term] = g
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Report Cards</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <div className="mb-4">
          <select
            value={selectedSemester}
            onChange={(e) => {
              setSelectedSemester(e.target.value)
              if (selectedStudent) fetchGrades(selectedStudent.user._id, e.target.value)
            }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select semester</option>
            {semesters.map(s => (
              <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-6">
          {/* Left — Student List */}
          <div className="w-72 flex-shrink-0">
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[600px] overflow-y-auto">
              {filtered.map(s => (
                <button
                  key={s.user._id}
                  onClick={() => handleSelectStudent(s)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${selectedStudent?.user._id === s.user._id ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-800">{s.user.name}</p>
                  <p className="text-xs text-gray-400">{s.record?.studentNo} — {s.record?.programId?.code}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right — Report Card */}
          {selectedStudent ? (
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-800">{selectedStudent.user.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.record?.studentNo} — {selectedStudent.record?.programId?.name} — Year {selectedStudent.record?.yearLevel}
                  </p>
                </div>

                {Object.keys(grouped).length === 0 ? (
                  <p className="text-sm text-gray-400">No grades found for this semester.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Subject</th>
                        {TERMS.map(t => (
                          <th key={t} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 capitalize">{t}</th>
                        ))}
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Final Grade</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.values(grouped).map(item => {
                        const finalGrade = item.terms['finals']?.cumulativeGrade || null
                        return (
                          <tr key={item.schedule._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800">{item.schedule.subjectId?.name}</p>
                              <p className="text-xs text-gray-400">{item.schedule.subjectId?.code}</p>
                            </td>
                            {TERMS.map(t => (
                              <td key={t} className="px-4 py-3 text-gray-600">
                                {item.terms[t]?.cumulativeGrade?.toFixed(2) || '—'}
                              </td>
                            ))}
                            <td className="px-4 py-3 font-semibold">
                              {finalGrade !== null ? (
                                <span className={finalGrade >= 75 ? 'text-green-600' : 'text-red-600'}>
                                  {finalGrade.toFixed(2)}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              {finalGrade !== null ? (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${finalGrade >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {finalGrade >= 75 ? 'Passed' : 'Failed'}
                                </span>
                              ) : <span className="text-xs text-gray-300">Pending</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-sm text-gray-400">Select a student to view their report card</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}