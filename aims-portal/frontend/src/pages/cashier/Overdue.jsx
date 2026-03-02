import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function Overdue() {
  const [fees, setFees] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/fees/overdue')
        setFees(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load overdue fees')
      }
    }
    fetch()
  }, [])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Overdue Fees</h1>
        <p className="text-sm text-gray-500 mb-6">Students with unpaid or partial fees past their due date.</p>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Student', 'Semester', 'Total', 'Balance', 'Due Date', 'Days Overdue', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fees.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">No overdue fees</td></tr>
              ) : fees.map(fee => {
                const daysOverdue = Math.floor((new Date() - new Date(fee.dueDate)) / (1000 * 60 * 60 * 24))
                return (
                  <tr key={fee._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{fee.studentId?.name}</p>
                      <p className="text-xs text-gray-400">{fee.studentId?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fee.semesterId?.schoolYear} {fee.semesterId?.term}</td>
                    <td className="px-4 py-3 text-gray-700">₱{fee.totalAmount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">₱{fee.balance?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(fee.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-red-600 font-medium">{daysOverdue} days</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${fee.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {fee.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}