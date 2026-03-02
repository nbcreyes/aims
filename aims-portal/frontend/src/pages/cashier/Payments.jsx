import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function Payments() {
  const [fees, setFees] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedFee, setSelectedFee] = useState(null)
  const [feePayments, setFeePayments] = useState([])
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
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
    const fetch = async () => {
      try {
        const res = await api.get(`/fees?semesterId=${selectedSemester}&status=unpaid&status=partial`)
        setFees(res.data.data)
      } catch { }
    }
    fetch()
  }, [selectedSemester])

  const handleSelectFee = async (fee) => {
    setError('')
    setSuccess('')
    setAmount('')
    setNotes('')
    try {
      const res = await api.get(`/fees/${fee._id}`)
      setSelectedFee(res.data.data.fee)
      setFeePayments(res.data.data.payments)
    } catch {
      setError('Failed to load fee details')
    }
  }

  const handlePayment = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Enter a valid amount')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/payments', {
        studentFeeId: selectedFee._id,
        amountPaid: Number(amount),
        notes
      })
      setSuccess(`Payment recorded. Receipt No: ${res.data.data.payment.receiptNo}`)
      setAmount('')
      setNotes('')

      // Refresh fee data
      const updated = await api.get(`/fees/${selectedFee._id}`)
      setSelectedFee(updated.data.data.fee)
      setFeePayments(updated.data.data.payments)

      // Refresh fee list
      const listRes = await api.get(`/fees?semesterId=${selectedSemester}`)
      setFees(listRes.data.data.filter(f => f.status !== 'paid'))
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const filtered = fees.filter(f =>
    f.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.studentId?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Record Payment</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        <div className="flex gap-6">
          {/* Left — Student Fee List */}
          <div className="w-72 flex-shrink-0">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select semester</option>
              {semesters.map(s => (
                <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">No unpaid fees found</p>
              ) : filtered.map(fee => (
                <button
                  key={fee._id}
                  onClick={() => handleSelectFee(fee)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${selectedFee?._id === fee._id ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-800">{fee.studentId?.name}</p>
                  <p className="text-xs text-gray-400">Balance: ₱{fee.balance?.toLocaleString()}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${fee.status === 'partial' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {fee.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right — Payment Form */}
          {selectedFee ? (
            <div className="flex-1 space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Fee Summary — {selectedFee.studentId?.name}</h2>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Total Amount', value: `₱${selectedFee.totalAmount?.toLocaleString()}`, color: 'text-gray-800' },
                    { label: 'Amount Paid', value: `₱${selectedFee.paidAmount?.toLocaleString()}`, color: 'text-green-600' },
                    { label: 'Balance', value: `₱${selectedFee.balance?.toLocaleString()}`, color: 'text-red-600' }
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-md p-3">
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                      <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Breakdown</p>
                  {selectedFee.breakdown?.map((b, i) => (
                    <div key={i} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-500">{b.description}</span>
                      <span className="text-gray-700">₱{b.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {selectedFee.status !== 'paid' && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Amount to Pay</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Max: ${selectedFee.balance}`}
                        max={selectedFee.balance}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Record Payment'}
                    </button>
                  </div>
                )}
              </div>

              {feePayments.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment History</h3>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Receipt No', 'Amount', 'Date', 'Cashier', 'Notes'].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {feePayments.map(p => (
                        <tr key={p._id}>
                          <td className="px-3 py-2 text-xs font-mono text-gray-700">{p.receiptNo}</td>
                          <td className="px-3 py-2 text-green-600 font-medium">₱{p.amountPaid?.toLocaleString()}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs">{new Date(p.paymentDate).toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-gray-600 text-xs">{p.cashierId?.name}</td>
                          <td className="px-3 py-2 text-gray-400 text-xs">{p.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center h-48">
              <p className="text-sm text-gray-400">Select a student to record payment</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}