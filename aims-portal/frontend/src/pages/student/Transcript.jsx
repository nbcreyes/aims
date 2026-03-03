import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'
import useAuth from '../../hooks/useAuth'

export default function StudentTranscript() {
  const { user } = useAuth()
  const [transcript, setTranscript] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      try {
        const res = await api.get(`/students/${user._id}/transcript`)
        setTranscript(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load transcript')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  if (loading) return (
    <DashboardLayout>
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Loading transcript...</p>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">My Transcript</h1>
          {transcript && (
            <a
              href={`${import.meta.env.VITE_API_URL}/pdf/tor/${user?._id}`}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Download TOR PDF
            </a>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        {transcript && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Overall GWA</p>
                <p className="text-3xl font-bold text-blue-700">
                  {transcript.overallGWA?.toFixed(4) ?? '—'}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Units Earned</p>
                <p className="text-3xl font-bold text-green-600">{transcript.totalUnitsEarned}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Semesters Completed</p>
                <p className="text-3xl font-bold text-gray-700">{transcript.semesters.length}</p>
              </div>
            </div>

            {/* Semester Blocks */}
            {transcript.semesters.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-400">No grade records yet.</p>
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
                          <td className="px-4 py-2.5 text-center text-gray-500 text-xs">
                            {sub.terms['prelim']?.cumulativeGrade?.toFixed(2) || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-center text-gray-500 text-xs">
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
        )}
      </div>
    </DashboardLayout>
  )
}