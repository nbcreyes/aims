import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const STATUS_COLORS = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700'
}

export default function StudentFees() {
  const [fees, setFees] = useState([])
  const [selected, setSelected] = useState(null)
  const [payments, setPayments] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/fees/my')
        setFees(res.data.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load fees')
      }
    }
    fetch()
  }, [])

  const handleSelect = async (fee) => {
    try {
      const res = await api.get(`/fees/${fee._id}`)
      setSelected(res.data.data.fee)
      setPayments(res.data.data.payments)
    } catch {
      setError('Failed to load fee details')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">My Fees</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        <div className="flex gap-6">
          <div className="flex-1">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Semester', 'Total', 'Paid', 'Balance', 'Due Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fees.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">No fee records found</td></tr>
                  ) : fees.map(fee => (
                    <tr key={fee._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {fee.semesterId?.schoolYear} {fee.semesterId?.term}
                      </td>
                      <td className="px-4 py-3 text-gray-700">₱{fee.totalAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-600">₱{fee.paidAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">₱{fee.balance?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[fee.status]}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleSelect(fee)} className="text-blue-600 hover:underline text-xs">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="w-72 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Fee Details</h2>
                <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
              </div>

              <div className="space-y-1 text-xs mb-4">
                {selected.breakdown?.map((b, i) => (
                  <div key={i} className="flex justify-between py-0.5">
                    <span className="text-gray-500">{b.description}</span>
                    <span className="text-gray-700">₱{b.amount?.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold">
                  <span className="text-gray-700">Total</span>
                  <span className="text-gray-800">₱{selected.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              {payments.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Payment History</p>
                  <div className="space-y-2">
                    {payments.map(p => (
                      <div key={p._id} className="text-xs border border-gray-100 rounded p-2">
                        <div className="flex justify-between">
                          <span className="text-green-600 font-medium">₱{p.amountPaid?.toLocaleString()}</span>
                          <span className="text-gray-400">{new Date(p.paymentDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-400 font-mono">{p.receiptNo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}