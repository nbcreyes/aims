import { useEffect, useState } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'
import useAuth from '../../hooks/useAuth'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [record, setRecord] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [activeSemester, setActiveSemester] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const recRes = await api.get('/students/my')
        setRecord(recRes.data.data)

        const semRes = await api.get('/semesters/active')
        const sem = semRes.data.data
        setActiveSemester(sem)

        const envRes = await api.get(`/enrollments/my?semesterId=${sem._id}`)
        setEnrollment(envRes.data.data)
      } catch { }
    }
    init()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-400 mb-6">Student Portal</p>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Student No.</p>
            <p className="text-base font-semibold text-gray-800">{record?.record?.studentNo || '—'}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Program</p>
            <p className="text-base font-semibold text-gray-800">{record?.record?.programId?.code || '—'}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Year Level</p>
            <p className="text-base font-semibold text-gray-800">Year {record?.record?.yearLevel || '—'}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Current Semester</p>
          {activeSemester ? (
            <p className="text-sm font-medium text-gray-800">{activeSemester.schoolYear} — {activeSemester.term}</p>
          ) : (
            <p className="text-sm text-gray-400">No active semester</p>
          )}
          {enrollment && (
            <p className="text-xs mt-1">
              Enrollment status:{' '}
              <span className={`font-medium ${
                enrollment.status === 'approved' ? 'text-green-600' :
                enrollment.status === 'pending' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {enrollment.status}
              </span>
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}