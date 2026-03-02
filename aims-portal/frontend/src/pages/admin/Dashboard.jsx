import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'
import useAuth from '../../hooks/useAuth'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalPrograms: 0,
    activeEnrollments: 0,
    pendingApplications: 0,
    overdueCount: 0
  })
  const [enrollmentByProgram, setEnrollmentByProgram] = useState([])
  const [feeStatus, setFeeStatus] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const [studentsRes, teachersRes, programsRes, applicationsRes, enrollmentsRes, feesRes] = await Promise.all([
          api.get('/users?role=student'),
          api.get('/users?role=teacher'),
          api.get('/programs'),
          api.get('/applications?status=pending'),
          api.get('/enrollments?status=approved'),
          api.get('/fees')
        ])

        setStats({
          totalStudents: studentsRes.data.data.length,
          totalTeachers: teachersRes.data.data.length,
          totalPrograms: programsRes.data.data.length,
          activeEnrollments: enrollmentsRes.data.data.length,
          pendingApplications: applicationsRes.data.data.length,
          overdueCount: feesRes.data.data.filter(f => f.status !== 'paid').length
        })

        // Enrollment by program
        const programCount = {}
        for (const e of enrollmentsRes.data.data) {
          const code = e.programId?.code || 'Unknown'
          programCount[code] = (programCount[code] || 0) + 1
        }
        setEnrollmentByProgram(Object.entries(programCount).map(([name, value]) => ({ name, value })))

        // Fee status breakdown
        const fees = feesRes.data.data
        const paid = fees.filter(f => f.status === 'paid').length
        const partial = fees.filter(f => f.status === 'partial').length
        const unpaid = fees.filter(f => f.status === 'unpaid').length
        setFeeStatus([
          { name: 'Paid', value: paid },
          { name: 'Partial', value: partial },
          { name: 'Unpaid', value: unpaid }
        ])
      } catch (err) {
        setError('Failed to load dashboard data')
      }
    }
    init()
  }, [])

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, color: 'text-blue-600' },
    { label: 'Total Teachers', value: stats.totalTeachers, color: 'text-green-600' },
    { label: 'Programs', value: stats.totalPrograms, color: 'text-purple-600' },
    { label: 'Active Enrollments', value: stats.activeEnrollments, color: 'text-teal-600' },
    { label: 'Pending Applications', value: stats.pendingApplications, color: 'text-yellow-600' },
    { label: 'Unpaid Fees', value: stats.overdueCount, color: 'text-red-600' }
  ]

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-400 mb-6 capitalize">{user?.role} — AIMS Portal</p>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statCards.map(card => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Enrollment by Program */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Enrollments by Program</p>
            {enrollmentByProgram.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No enrollment data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={enrollmentByProgram}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Fee Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Fee Collection Status</p>
            {feeStatus.every(f => f.value === 0) ? (
              <p className="text-sm text-gray-400 text-center py-8">No fee data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={feeStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {feeStatus.map((_, i) => (
                      <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444'][i]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}