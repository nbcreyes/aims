import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const TERMS = ['prelim', 'midterm', 'finals']

export default function StudentGrades() {
  const [grades, setGrades] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [error, setError] = useState('')

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
        const res = await api.get(`/grades/my?semesterId=${selectedSemester}`)
        setGrades(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load grades')
      }
    }
    fetch()
  }, [selectedSemester])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">My Grades</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <div className="mb-4">
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
        </div>

        {grades.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-40">
            <p className="text-sm text-gray-400">No published grades found for this semester.</p>
          </div>
        )}

        {grades.map(item => (
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
                      <td className="px-4 py-3 text-gray-600">{g ? g.classStanding?.toFixed(2) : '—'}</td>
                      <td className="px-4 py-3">
                        {g ? (
                          <span className={`font-semibold ${g.cumulativeGrade >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                            {g.cumulativeGrade?.toFixed(2)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {g ? (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${g.cumulativeGrade >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {g.cumulativeGrade >= 75 ? 'Passed' : 'Failed'}
                          </span>
                        ) : <span className="text-xs text-gray-300">Not yet released</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}