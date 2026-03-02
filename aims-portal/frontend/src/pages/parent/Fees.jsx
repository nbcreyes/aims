import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const STATUS_COLORS = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700'
}

export default function ParentFees() {
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState('')
  const [fees, setFees] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/parent/children')
        setChildren(res.data.data)
        if (res.data.data.length > 0) setSelectedChild(res.data.data[0].user._id)
      } catch { }
    }
    fetch()
  }, [])

  useEffect(() => {
    if (!selectedChild) return
    const fetch = async () => {
      try {
        const res = await api.get(`/parent/children/${selectedChild}/fees`)
        setFees(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load fees')
      }
    }
    fetch()
  }, [selectedChild])

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Child Fees</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <div className="mb-4">
          <select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {children.map(c => <option key={c.user._id} value={c.user._id}>{c.user.name}</option>)}
          </select>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Semester', 'Total', 'Paid', 'Balance', 'Due Date', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fees.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">No fee records found</td></tr>
              ) : fees.map(fee => (
                <tr key={fee._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{fee.semesterId?.schoolYear} {fee.semesterId?.term}</td>
                  <td className="px-4 py-3 text-gray-700">₱{fee.totalAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">₱{fee.paidAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">₱{fee.balance?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[fee.status]}`}>{fee.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}