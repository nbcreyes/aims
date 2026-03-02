import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import NotificationBell from './NotificationBell'

const NAV = {
  superadmin: [
    { label: 'Dashboard', path: '/superadmin/dashboard' },
    { label: 'User Management', path: '/superadmin/users' },
    { label: 'Programs', path: '/superadmin/programs' },
    { label: 'Semesters', path: '/superadmin/semesters' },
    { label: 'Subjects', path: '/superadmin/subjects' },
    { label: 'Sections', path: '/superadmin/sections' },
    { label: 'Scheduling', path: '/registrar/scheduling' },
    { label: 'Applications', path: '/registrar/applications' },
    { label: 'Enrollments', path: '/registrar/enrollments' },
    { label: 'Student Records', path: '/registrar/student-records' },
    { label: 'Attendance Reports', path: '/registrar/attendance-reports' },
    { label: 'Report Cards', path: '/registrar/report-cards' },
    { label: 'Fees', path: '/cashier/fees' },
    { label: 'Announcements', path: '/superadmin/announcements' }
  ],
  registrar: [
    { label: 'Dashboard', path: '/registrar/dashboard' },
    { label: 'Programs', path: '/superadmin/programs' },
    { label: 'Semesters', path: '/superadmin/semesters' },
    { label: 'Subjects', path: '/superadmin/subjects' },
    { label: 'Sections', path: '/superadmin/sections' },
    { label: 'Scheduling', path: '/registrar/scheduling' },
    { label: 'Applications', path: '/registrar/applications' },
    { label: 'Enrollments', path: '/registrar/enrollments' },
    { label: 'Student Records', path: '/registrar/student-records' },
    { label: 'Attendance Reports', path: '/registrar/attendance-reports' },
    { label: 'Report Cards', path: '/registrar/report-cards' },
    { label: 'Announcements', path: '/registrar/announcements' }
  ],
  cashier: [
    { label: 'Dashboard', path: '/cashier/dashboard' },
    { label: 'Fees', path: '/cashier/fees' },
    { label: 'Payments', path: '/cashier/payments' },
    { label: 'Receipts', path: '/cashier/receipts' },
    { label: 'Overdue', path: '/cashier/overdue' }
  ],
  teacher: [
    { label: 'Dashboard', path: '/teacher/dashboard' },
    { label: 'My Classes', path: '/teacher/classes' },
    { label: 'Attendance', path: '/teacher/attendance' },
    { label: 'Grades', path: '/teacher/grades' },
    { label: 'Announcements', path: '/teacher/announcements' }
  ],
  student: [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'Enrollment', path: '/student/enrollment' },
    { label: 'Schedule', path: '/student/schedule' },
    { label: 'Attendance', path: '/student/attendance' },
    { label: 'Grades', path: '/student/grades' },
    { label: 'Fees', path: '/student/fees' },
    { label: 'Announcements', path: '/student/announcements' }
  ],
  parent: [
    { label: 'Dashboard', path: '/parent/dashboard' },
    { label: 'Grades', path: '/parent/grades' },
    { label: 'Attendance', path: '/parent/attendance' },
    { label: 'Fees', path: '/parent/fees' },
    { label: 'Announcements', path: '/parent/announcements' }
  ]
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const links = NAV[user?.role] || []

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-gray-800">AIMS Portal</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(link => (
          <Link
            key={link.path}
            to={link.path}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              location.pathname === link.path
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium text-gray-800 truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}