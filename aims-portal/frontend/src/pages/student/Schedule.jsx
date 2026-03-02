import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function StudentSchedule() {
  const [schedules, setSchedules] = useState([])
  const [activeSemester, setActiveSemester] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const semRes = await api.get('/semesters/active')
        const sem = semRes.data.data
        setActiveSemester(sem)

        const res = await api.get(`/schedules/my?semesterId=${sem._id}`)
        setSchedules(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load schedule')
      }
    }
    init()
  }, [])

  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = schedules.filter(s => s.day === day)
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-2">My Schedule</h1>
        {activeSemester && (
          <p className="text-sm text-gray-500 mb-6">
            {activeSemester.schoolYear} — {activeSemester.term}
          </p>
        )}

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        {schedules.length === 0 && !error && (
          <p className="text-sm text-gray-400">No schedule found for this semester.</p>
        )}

        <div className="space-y-4">
          {DAYS.map(day => byDay[day].length > 0 && (
            <div key={day} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                <p className="text-xs font-semibold text-gray-600">{day}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Subject', 'Code', 'Units', 'Teacher', 'Time', 'Room'].map(h => (
                      <th key={h} className="text-left px-4 py-2 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {byDay[day].map(s => (
                    <tr key={s._id}>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.subjectId?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.subjectId?.code}</td>
                      <td className="px-4 py-3 text-gray-600">{s.subjectId?.units}</td>
                      <td className="px-4 py-3 text-gray-600">{s.teacherId?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.timeStart} – {s.timeEnd}</td>
                      <td className="px-4 py-3 text-gray-600">{s.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}