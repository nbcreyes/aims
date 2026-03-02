import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function AttendanceReports() {
  const [schedules, setSchedules] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [report, setReport] = useState(null)
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
        const res = await api.get(`/schedules?semesterId=${selectedSemester}`)
        setSchedules(res.data.data)
      } catch { }
    }
    fetch()
  }, [selectedSemester])

  const fetchReport = async (scheduleId) => {
    setError('')
    setReport(null)
    try {
      const res = await api.get(`/attendance/report?scheduleId=${scheduleId}`)
      setReport(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report')
    }
  }

  const handleScheduleChange = (e) => {
    setSelectedSchedule(e.target.value)
    if (e.target.value) fetchReport(e.target.value)
  }

  const selectedSched = schedules.find(s => s._id === selectedSchedule)

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Attendance Reports</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <div className="flex gap-3 mb-6">
          <select
            value={selectedSemester}
            onChange={(e) => { setSelectedSemester(e.target.value); setSelectedSchedule(''); setReport(null) }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select semester</option>
            {semesters.map(s => (
              <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
            ))}
          </select>

          <select
            value={selectedSchedule}
            onChange={handleScheduleChange}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select class</option>
            {schedules.map(s => (
              <option key={s._id} value={s._id}>
                {s.subjectId?.name} — {s.sectionId?.name} ({s.day} {s.timeStart}–{s.timeEnd})
              </option>
            ))}
          </select>
        </div>

        {selectedSched && report && (
          <>
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700">{selectedSched.subjectId?.name}</p>
              <p className="text-xs text-gray-400">
                {selectedSched.teacherId?.name} — {selectedSched.sectionId?.name} — Total sessions: {report.sessions}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Student', 'Present', 'Late', 'Absent', 'Total', 'Attendance Rate'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.report.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">No attendance records found</td></tr>
                  ) : report.report.map(r => {
                    const rate = r.total > 0 ? (((r.present + r.late) / r.total) * 100).toFixed(1) : 0
                    return (
                      <tr key={r.student._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{r.student.name}</p>
                          <p className="text-xs text-gray-400">{r.student.email}</p>
                        </td>
                        <td className="px-4 py-3 text-green-600 font-medium">{r.present}</td>
                        <td className="px-4 py-3 text-yellow-600 font-medium">{r.late}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{r.absent}</td>
                        <td className="px-4 py-3 text-gray-600">{r.total}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${Number(rate) >= 75 ? 'bg-green-500' : 'bg-red-400'}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${Number(rate) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                              {rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!selectedSchedule && (
          <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-48">
            <p className="text-sm text-gray-400">Select a semester and class to view the report</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}