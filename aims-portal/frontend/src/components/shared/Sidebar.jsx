import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import NotificationBell from './NotificationBell'

const NAV = {
  superadmin: [
    { label: 'Dashboard', path: '/superadmin/dashboard' },
    { label: 'User Management', path: '/superadmin/users' },
    { label: 'Programs', path: '/superadmin/programs' },
    { label: 'Departments', path: '/superadmin/departments' },
    { label: 'Semesters', path: '/superadmin/semesters' },
    { label: 'Subjects', path: '/superadmin/subjects' },
    { label: 'Sections', path: '/superadmin/sections' },
    { label: 'Curriculum', path: '/superadmin/curriculum' },
    { label: 'Scheduling', path: '/registrar/scheduling' },
    { label: 'Applications', path: '/registrar/applications' },
    { label: 'Enrollments', path: '/registrar/enrollments' },
    { label: 'Student Records', path: '/registrar/student-records' },
    { label: 'Attendance Reports', path: '/registrar/attendance-reports' },
    { label: 'Report Cards', path: '/registrar/report-cards' },
    { label: 'Fees', path: '/cashier/fees' },
    { label: 'Announcements', path: '/superadmin/announcements' },
    { label: 'Profile', path: '/superadmin/profile' },
    { label: 'Change Password', path: '/superadmin/change-password' }
  ],
  registrar: [
    { label: 'Dashboard', path: '/registrar/dashboard' },
    { label: 'Programs', path: '/superadmin/programs' },
    { label: 'Departments', path: '/superadmin/departments' },
    { label: 'Semesters', path: '/superadmin/semesters' },
    { label: 'Subjects', path: '/superadmin/subjects' },
    { label: 'Sections', path: '/superadmin/sections' },
    { label: 'Curriculum', path: '/superadmin/curriculum' },
    { label: 'Scheduling', path: '/registrar/scheduling' },
    { label: 'Applications', path: '/registrar/applications' },
    { label: 'Enrollments', path: '/registrar/enrollments' },
    { label: 'Student Records', path: '/registrar/student-records' },
    { label: 'Attendance Reports', path: '/registrar/attendance-reports' },
    { label: 'Report Cards', path: '/registrar/report-cards' },
    { label: 'Announcements', path: '/registrar/announcements' },
    { label: 'Profile', path: '/registrar/profile' },
    { label: 'Change Password', path: '/registrar/change-password' }
  ],
  cashier: [
    { label: 'Dashboard', path: '/cashier/dashboard' },
    { label: 'Fees', path: '/cashier/fees' },
    { label: 'Payments', path: '/cashier/payments' },
    { label: 'Receipts', path: '/cashier/receipts' },
    { label: 'Overdue', path: '/cashier/overdue' },
    { label: 'Profile', path: '/cashier/profile' },
    { label: 'Change Password', path: '/cashier/change-password' }
  ],
  teacher: [
    { label: 'Dashboard', path: '/teacher/dashboard' },
    { label: 'My Classes', path: '/teacher/classes' },
    { label: 'Attendance', path: '/teacher/attendance' },
    { label: 'Grades', path: '/teacher/grades' },
    { label: 'Announcements', path: '/teacher/announcements' },
    { label: 'Profile', path: '/teacher/profile' },
    { label: 'Change Password', path: '/teacher/change-password' }
  ],
  student: [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'Enrollment', path: '/student/enrollment' },
    { label: 'Schedule', path: '/student/schedule' },
    { label: 'Attendance', path: '/student/attendance' },
    { label: 'Grades', path: '/student/grades' },
    { label: 'Fees', path: '/student/fees' },
    { label: 'Announcements', path: '/student/announcements' },
    { label: 'Profile', path: '/student/profile' },
    { label: 'Change Password', path: '/student/change-password' }
  ],
  parent: [
    { label: 'Dashboard', path: '/parent/dashboard' },
    { label: 'Grades', path: '/parent/grades' },
    { label: 'Attendance', path: '/parent/attendance' },
    { label: 'Fees', path: '/parent/fees' },
    { label: 'Announcements', path: '/parent/announcements' },
    { label: 'Profile', path: '/parent/profile' },
    { label: 'Change Password', path: '/parent/change-password' }
  ]
}

const ROLE_COLORS = {
  superadmin: 'bg-purple-100 text-purple-700',
  registrar: 'bg-blue-100 text-blue-700',
  cashier: 'bg-green-100 text-green-700',
  teacher: 'bg-teal-100 text-teal-700',
  student: 'bg-yellow-100 text-yellow-700',
  parent: 'bg-pink-100 text-pink-700'
}

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const links = NAV[user?.role] || []
  const profilePath = `/${user?.role}/profile`
  const avatarUrl = user?.avatar
    ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}${user.avatar}`
    : null

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Split nav into main links and bottom links (Profile, Change Password)
  const mainLinks = links.filter(l =>
    l.label !== 'Profile' && l.label !== 'Change Password'
  )
  const accountLinks = links.filter(l =>
    l.label === 'Profile' || l.label === 'Change Password'
  )

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-56'} min-h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-gray-800">AIMS Portal</p>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize mt-0.5 inline-block ${ROLE_COLORS[user?.role] || 'bg-gray-100 text-gray-600'}`}>
              {user?.role}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {!collapsed && <NotificationBell />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {mainLinks.map(link => {
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              {collapsed ? (
                <span className="text-xs font-bold">
                  {link.label.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                link.label
              )}
            </Link>
          )
        })}
      </nav>

      {/* Account Section */}
      <div className="border-t border-gray-100 px-2 py-3 space-y-0.5">
        {/* Profile Avatar + Name */}
        <Link
          to={profilePath}
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? user?.name : undefined}
        >
          <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center bg-blue-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-blue-600">
                {getInitials(user?.name)}
              </span>
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          )}
        </Link>

        {/* Account links (Profile, Change Password) */}
        {!collapsed && accountLinks.map(link => {
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {link.label}
            </Link>
          )
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors ${collapsed ? 'text-center' : ''}`}
        >
          {collapsed ? '→' : 'Log Out'}
        </button>
      </div>
    </aside>
  )
}