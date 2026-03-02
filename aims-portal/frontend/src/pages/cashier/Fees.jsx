import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const STATUS_COLORS = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700'
}

export default function Fees() {
  const [fees, setFees] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selected, setSelected] = useState(null)
  const [payments, setPayments] = useState([])
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const semRes = await api.get('/semesters')
        setSemesters(semRes.data.data)
        const active = semRes.data.data.find(s => s.isActive)
        if (active) setSelectedSemester(active._id)
      } catch { }
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedSemester) return
    fetchFees()
  }, [selectedSemester, filterStatus])

  const fetchFees = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedSemester) params.append('semesterId', selectedSemester)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      const res = await api.get(`/fees?${params.toString()}`)
      setFees(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch fees')
    }
  }

  const handleSelect = async (fee) => {
    setError('')
    setSuccess('')
    try {
      const res = await api.get(`/fees/${fee._id}`)
      setSelected(res.data.data.fee)
      setPayments(res.data.data.payments)
      setDueDate(res.data.data.fee.dueDate?.slice(0, 10) || '')
    } catch (err) {
      setError('Failed to load fee details')
    }
  }

  const handleSetDueDate = async () => {
    if (!dueDate) return
    setLoading(true)
    try {
      await api.put(`/fees/${selected._id}/due-date`, { dueDate })
      setSuccess('Due date updated')
      fetchFees()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update due date')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Student Fees</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select semester</option>
            {semesters.map(s => (
              <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
            ))}
          </select>

          <div className="flex gap-2">
            {['all', 'unpaid', 'partial', 'paid'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium border ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Fee List */}
          <div className="flex-1">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Student', 'Semester', 'Total', 'Paid', 'Balance', 'Status', 'Due Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fees.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400 text-sm">No fees found</td></tr>
                  ) : fees.map(fee => (
                    <tr key={fee._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{fee.studentId?.name}</p>
                        <p className="text-xs text-gray-400">{fee.studentId?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fee.semesterId?.schoolYear} {fee.semesterId?.term}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">₱{fee.totalAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-600">₱{fee.paidAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">₱{fee.balance?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[fee.status]}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleSelect(fee)} className="text-blue-600 hover:underline text-xs">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fee Detail Panel */}
          {selected && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">Fee Details</h2>
                  <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Student</span>
                    <span className="font-medium text-gray-800">{selected.studentId?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-medium text-gray-800">₱{selected.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid</span>
                    <span className="text-green-600 font-medium">₱{selected.paidAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Balance</span>
                    <span className="text-red-600 font-medium">₱{selected.balance?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Breakdown</p>
                  <div className="space-y-1">
                    {selected.breakdown?.map((b, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-500">{b.description}</span>
                        <span className="text-gray-700">₱{b.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Set Due Date</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSetDueDate}
                      disabled={loading}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      Set
                    </button>
                  </div>
                </div>

                {payments.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Payment History</p>
                    <div className="space-y-2">
                      {payments.map(p => (
                        <div key={p._id} className="text-xs border border-gray-100 rounded p-2">
                          <div className="flex justify-between mb-0.5">
                            <span className="font-medium text-gray-700">₱{p.amountPaid?.toLocaleString()}</span>
                            <span className="text-gray-400">{new Date(p.paymentDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">{p.receiptNo}</span>
                            <span className="text-gray-500">{p.cashierId?.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}