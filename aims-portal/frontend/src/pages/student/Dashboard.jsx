import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'
import GWAWidget from '../../components/shared/GWAWidget'
import useAuth from '../../hooks/useAuth'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [record, setRecord] = useState(null)
  const [activeSemester, setActiveSemester] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const [recRes, semRes, annRes] = await Promise.all([
          api.get(`/students/${user._id}`),
          api.get('/semesters/active'),
          api.get('/announcements')
        ])
        setRecord(recRes.data.data?.record)
        const sem = semRes.data.data
        setActiveSemester(sem)

        // Fetch enrollments for active semester
        if (sem) {
          try {
            const envRes = await api.get(`/enrollments/my?semesterId=${sem._id}`)
            setEnrollments(envRes.data.data)
          } catch {}
        }

        setAnnouncements(annRes.data.data?.slice(0, 3) || [])
      } catch {}
      finally {
        setLoading(false)
      }
    }
    init()
  }, [user._id])

  const approvedEnrollments = enrollments.filter(e => e.status === 'approved')
  const totalUnits = approvedEnrollments.reduce(
    (sum, e) => sum + (e.scheduleId?.subjectId?.units || 0), 0
  )
  const allApproved = enrollments.length > 0 && enrollments.every(e => e.status === 'approved')

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center h-64">
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeSemester
              ? `${activeSemester.schoolYear} — ${activeSemester.term}`
              : 'No active semester'}
          </p>
        </div>

        {/* Student Info Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-bold text-xl">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {record?.studentNo && (
                <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                  #{record.studentNo}
                </span>
              )}
              {record?.programId?.name && (
                <span className="text-xs text-gray-500">
                  {record.programId.name} ({record.programId.code})
                </span>
              )}
              {record?.yearLevel && (
                <span className="text-xs text-gray-500">Year {record.yearLevel}</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {user?.status || 'active'}
              </span>
            </div>
          </div>
          {/* COR Download */}
          {allApproved && activeSemester && (
            <a
              href={`${import.meta.env.VITE_API_URL}/pdf/cor/${user?._id}/${activeSemester._id}`}
              target="_blank"
              rel="noreferrer"
              className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 font-medium"
            >
              Download COR
            </a>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Enrolled Subjects</p>
            <p className="text-3xl font-bold text-blue-600">{approvedEnrollments.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {enrollments.filter(e => e.status === 'pending').length} pending approval
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total Units</p>
            <p className="text-3xl font-bold text-green-600">{totalUnits}</p>
            <p className="text-xs text-gray-400 mt-1">This semester</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Year Level</p>
            <p className="text-3xl font-bold text-purple-600">{record?.yearLevel || '—'}</p>
            <p className="text-xs text-gray-400 mt-1">{record?.programId?.code || 'No program'}</p>
          </div>
        </div>

        {/* GWA Cards */}
        {record && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {activeSemester && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Semester GWA</p>
                <GWAWidget
                  studentId={user._id}
                  semesterId={activeSemester._id}
                  compact={true}
                />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Overall GWA</p>
              <GWAWidget studentId={user._id} compact={true} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Current Schedule */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Current Subjects</p>
              <Link to="/student/enrollment" className="text-xs text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            {approvedEnrollments.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-400">No approved enrollments</p>
                <Link
                  to="/student/enrollment"
                  className="inline-block mt-2 text-xs text-blue-600 hover:underline"
                >
                  Enroll now →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {approvedEnrollments.slice(0, 5).map(e => (
                  <div key={e._id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {e.scheduleId?.subjectId?.code}
                      </p>
                      <p className="text-xs text-gray-400">{e.scheduleId?.subjectId?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{e.scheduleId?.day}</p>
                      <p className="text-xs text-gray-400">
                        {e.scheduleId?.timeStart} — {e.scheduleId?.timeEnd}
                      </p>
                    </div>
                  </div>
                ))}
                {approvedEnrollments.length > 5 && (
                  <div className="px-4 py-2 text-center">
                    <Link to="/student/enrollment" className="text-xs text-blue-600 hover:underline">
                      +{approvedEnrollments.length - 5} more
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Announcements */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Announcements</p>
              <Link to="/student/announcements" className="text-xs text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            {announcements.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-400">No announcements</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {announcements.map(a => (
                  <div key={a._id} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(a.createdAt).toLocaleDateString()} — {a.createdBy?.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          {[
            { label: 'My Schedule', path: '/student/schedule', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'My Grades', path: '/student/grades', color: 'bg-green-50 text-green-700 border-green-200' },
            { label: 'My Fees', path: '/student/fees', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            { label: 'My Attendance', path: '/student/attendance', color: 'bg-purple-50 text-purple-700 border-purple-200' }
          ].map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`border rounded-lg px-4 py-3 text-sm font-medium text-center hover:opacity-80 transition-opacity ${link.color}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}