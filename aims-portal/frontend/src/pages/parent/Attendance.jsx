import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  'no record': 'bg-gray-100 text-gray-400'
}

export default function ParentAttendance() {
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState('')
  const [schedules, setSchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [attendance, setAttendance] = useState(null)
  const [activeSemester, setActiveSemester] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const [childRes, semRes] = await Promise.all([
          api.get('/parent/children'),
          api.get('/semesters/active')
        ])
        setChildren(childRes.data.data)
        setActiveSemester(semRes.data.data)
        if (childRes.data.data.length > 0) setSelectedChild(childRes.data.data[0].user._id)
      } catch { }
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedChild || !activeSemester) return
    const fetch = async () => {
      try {
        const envRes = await api.get(`/parent/children/${selectedChild}/enrollment?semesterId=${activeSemester._id}`)
        if (envRes.data.data?.subjects) setSchedules(envRes.data.data.subjects)
      } catch { }
    }
    fetch()
  }, [selectedChild, activeSemester])

  useEffect(() => {
    if (!selectedSchedule || !selectedChild) return
    const fetch = async () => {
      try {
        const res = await api.get(`/parent/children/${selectedChild}/attendance?scheduleId=${selectedSchedule}`)
        setAttendance(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load attendance')
      }
    }
    fetch()
  }, [selectedSchedule, selectedChild])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Child Attendance</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <div className="flex gap-3 mb-6">
          <select value={selectedChild} onChange={(e) => { setSelectedChild(e.target.value); setAttendance(null) }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {children.map(c => <option key={c.user._id} value={c.user._id}>{c.user.name}</option>)}
          </select>
          <select value={selectedSchedule} onChange={(e) => setSelectedSchedule(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select subject</option>
            {schedules.map(s => (
              <option key={s._id} value={s._id}>{s.subjectId?.name}</option>
            ))}
          </select>
        </div>

        {attendance && (
          <>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total', value: attendance.summary.total, color: 'text-gray-800' },
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
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}