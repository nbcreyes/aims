import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'
import useAuth from '../../hooks/useAuth'

export default function RegistrarDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, totalStudents: 0 })
  const [enrollmentData, setEnrollmentData] = useState([])

  useEffect(() => {
    const init = async () => {
      try {
        const [appRes, enrollRes, studRes] = await Promise.all([
          api.get('/applications'),
          api.get('/enrollments'),
          api.get('/students')
        ])

        const apps = appRes.data.data
        const enrolls = enrollRes.data.data

        setStats({
          pending: apps.filter(a => a.status === 'pending').length,
          approved: enrolls.filter(e => e.status === 'approved').length,
          rejected: apps.filter(a => a.status === 'rejected').length,
          totalStudents: studRes.data.data.length
        })

        const byStatus = [
          { name: 'Pending', value: enrolls.filter(e => e.status === 'pending').length },
          { name: 'Approved', value: enrolls.filter(e => e.status === 'approved').length },
          { name: 'Rejected', value: enrolls.filter(e => e.status === 'rejected').length },
          { name: 'Dropped', value: enrolls.filter(e => e.status === 'dropped').length }
        ]
        setEnrollmentData(byStatus)
      } catch { }
    }
    init()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-400 mb-6">Registrar — AIMS Portal</p>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Students', value: stats.totalStudents, color: 'text-blue-600' },
            { label: 'Pending Applications', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Active Enrollments', value: stats.approved, color: 'text-green-600' },
            { label: 'Rejected Applications', value: stats.rejected, color: 'text-red-600' }
          ].map(card => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Enrollment Status Breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  )
}