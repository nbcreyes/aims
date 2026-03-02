import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const TERMS = ['prelim', 'midterm', 'finals']

export default function ParentGrades() {
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState('')
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [grades, setGrades] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const [childRes, semRes] = await Promise.all([
          api.get('/parent/children'),
          api.get('/semesters')
        ])
        setChildren(childRes.data.data)
        setSemesters(semRes.data.data)
        const active = semRes.data.data.find(s => s.isActive)
        if (active) setSelectedSemester(active._id)
        if (childRes.data.data.length > 0) setSelectedChild(childRes.data.data[0].user._id)
      } catch { }
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedChild || !selectedSemester) return
    const fetch = async () => {
      try {
        const res = await api.get(`/parent/children/${selectedChild}/grades?semesterId=${selectedSemester}`)
        setGrades(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load grades')
      }
    }
    fetch()
  }, [selectedChild, selectedSemester])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Child Grades</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <div className="flex gap-3 mb-6">
          <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {children.map(c => <option key={c.user._id} value={c.user._id}>{c.user.name}</option>)}
          </select>
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {semesters.map(s => <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>)}
          </select>
        </div>

        {grades.length === 0 ? (
          <p className="text-sm text-gray-400">No published grades found.</p>
        ) : grades.map(item => (
          <div key={item.schedule._id} className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <p className="text-sm font-semibold text-gray-800">{item.subject?.name}</p>
              <p className="text-xs text-gray-400">{item.subject?.code}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Term</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Grade</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {TERMS.map(term => {
                  const g = item.terms[term]
                  return (
                    <tr key={term}>
                      <td className="px-4 py-3 capitalize text-gray-700">{term}</td>
                      <td className="px-4 py-3">
                        {g ? <span className={`font-semibold ${g.cumulativeGrade >= 75 ? 'text-green-600' : 'text-red-600'}`}>{g.cumulativeGrade?.toFixed(2)}</span> : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {g ? (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${g.cumulativeGrade >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {g.cumulativeGrade >= 75 ? 'Passed' : 'Failed'}
                          </span>
                        ) : <span className="text-xs text-gray-300">Not released</span>}
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