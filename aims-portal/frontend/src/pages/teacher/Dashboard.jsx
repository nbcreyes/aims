import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'
import useAuth from '../../hooks/useAuth'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [activeSemester, setActiveSemester] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        const semRes = await api.get('/semesters/active')
        const sem = semRes.data.data
        setActiveSemester(sem)
        const res = await api.get(`/schedules/my?semesterId=${sem._id}`)
        setSchedules(res.data.data)
      } catch { }
    }
    init()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-400 mb-6">Teacher — AIMS Portal</p>

        {activeSemester && (
          <p className="text-sm text-gray-600 mb-4">
            Current Semester: <span className="font-medium">{activeSemester.schoolYear} — {activeSemester.term}</span>
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Classes This Semester</p>
            <p className="text-3xl font-bold text-blue-600">{schedules.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-semibold text-gray-700">My Classes</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Subject', 'Section', 'Day', 'Time', 'Room'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">No classes this semester</td></tr>
              ) : schedules.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.subjectId?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.sectionId?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.day}</td>
                  <td className="px-4 py-3 text-gray-600">{s.timeStart} – {s.timeEnd}</td>
                  <td className="px-4 py-3 text-gray-600">{s.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}