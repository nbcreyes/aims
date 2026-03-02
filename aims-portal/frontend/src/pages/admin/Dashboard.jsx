import DashboardLayout from '../../components/shared/DashboardLayout'
import useAuth from '../../hooks/useAuth'

export default function AdminDashboard() {
  const { user } = useAuth()
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">Role: {user?.role}</p>
      </div>
    </DashboardLayout>
  )
}