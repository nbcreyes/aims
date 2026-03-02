import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function CashierDashboard() {
  const [stats, setStats] = useState({ totalCollected: 0, totalBalance: 0, paid: 0, partial: 0, unpaid: 0 })
  const [pieData, setPieData] = useState([])

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/fees')
        const fees = res.data.data
        const paid = fees.filter(f => f.status === 'paid')
        const partial = fees.filter(f => f.status === 'partial')
        const unpaid = fees.filter(f => f.status === 'unpaid')
        const totalCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0)
        const totalBalance = fees.reduce((sum, f) => sum + f.balance, 0)

        setStats({ totalCollected, totalBalance, paid: paid.length, partial: partial.length, unpaid: unpaid.length })
        setPieData([
          { name: 'Paid', value: paid.length },
          { name: 'Partial', value: partial.length },
          { name: 'Unpaid', value: unpaid.length }
        ])
      } catch { }
    }
    init()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-400 mb-6">Cashier — AIMS Portal</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total Collected</p>
            <p className="text-3xl font-bold text-green-600">₱{stats.totalCollected?.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Outstanding Balance</p>
            <p className="text-3xl font-bold text-red-600">₱{stats.totalBalance?.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Fee Collection Breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444'][i]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  )
}