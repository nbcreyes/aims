import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function Receipts() {
  const [payments, setPayments] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/payments')
        setPayments(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load receipts')
      }
    }
    fetch()
  }, [])

  const filtered = payments.filter(p =>
    p.receiptNo?.toLowerCase().includes(search.toLowerCase()) ||
    p.studentId?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Receipts</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <input
          type="text"
          placeholder="Search by receipt no or student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm mb-4 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Receipt No', 'Student', 'Amount', 'Date', 'Cashier', 'Notes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">No receipts found</td></tr>
              ) : filtered.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm text-gray-700">{p.receiptNo}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{p.studentId?.name}</p>
                    <p className="text-xs text-gray-400">{p.studentId?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-green-600 font-semibold">₱{p.amountPaid?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">{p.cashierId?.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}