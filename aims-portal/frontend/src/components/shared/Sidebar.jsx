import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const navItems = {
  superadmin: [
    { label: 'Dashboard', path: '/superadmin/dashboard' },
    { label: 'Users', path: '/superadmin/users' },
    { label: 'Programs', path: '/superadmin/programs' },
    { label: 'Semesters', path: '/superadmin/semesters' },
    { label: 'Announcements', path: '/superadmin/announcements' }
  ],
  registrar: [
    { label: 'Dashboard', path: '/registrar/dashboard' },
    { label: 'Applications', path: '/registrar/applications' },
    { label: 'Enrollments', path: '/registrar/enrollments' },
    { label: 'Scheduling', path: '/registrar/scheduling' },
    { label: 'Student Records', path: '/registrar/student-records' }
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
    { label: 'Classes', path: '/teacher/classes' },
    { label: 'Attendance', path: '/teacher/attendance' },
    { label: 'Grades', path: '/teacher/grades' }
  ],
  student: [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'Enrollment', path: '/student/enrollment' },
    { label: 'Schedule', path: '/student/schedule' },
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
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const items = navItems[user?.role] || []

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="text-base font-bold text-gray-800">AIMS Portal</p>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 px-3 mb-2 truncate">{user?.name}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}