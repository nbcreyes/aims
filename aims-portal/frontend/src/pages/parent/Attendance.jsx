import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  'no record': 'bg-gray-100 text-gray-400'
}

export default function StudentAttendance() {
  const [schedules, setSchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [attendance, setAttendance] = useState(null)
  const [activeSemester, setActiveSemester] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const semRes = await api.get('/semesters/active')
        const sem = semRes.data.data
        setActiveSemester(sem)

        const envRes = await api.get(`/enrollments/my?semesterId=${sem._id}`)
        const enrollment = envRes.data.data
        if (enrollment?.subjects) {
          setSchedules(enrollment.subjects)
        }
      } catch { }
    }
    init()
  }, [])

  const fetchAttendance = async (scheduleId) => {
    setError('')
    try {
      const res = await api.get(`/attendance/my?scheduleId=${scheduleId}`)
      setAttendance(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance')
    }
  }

  const handleScheduleChange = (e) => {
    setSelectedSchedule(e.target.value)
    if (e.target.value) fetchAttendance(e.target.value)
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-2">My Attendance</h1>
        {activeSemester && (
          <p className="text-sm text-gray-500 mb-6">{activeSemester.schoolYear} — {activeSemester.term}</p>
        )}

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <div className="mb-4">
          <select
            value={selectedSchedule}
            onChange={handleScheduleChange}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a subject</option>
            {schedules.map(s => (
              <option key={s._id} value={s._id}>
                {s.subjectId?.name} ({s.subjectId?.code})
              </option>
            ))}
          </select>
        </div>

        {attendance && (
          <>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Sessions', value: attendance.summary.total, color: 'text-gray-800' },
                { label: 'Present', value: attendance.summary.present, color: 'text-green-600' },
                { label: 'Late', value: attendance.summary.late, color: 'text-yellow-600' },
                { label: 'Absent', value: attendance.summary.absent, color: 'text-red-600' }
              ].map(item => (
                <div key={item.label} className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.records.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!selectedSchedule && (
          <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-40">
            <p className="text-sm text-gray-400">Select a subject to view attendance</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}