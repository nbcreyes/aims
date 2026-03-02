import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
}

export default function Applications() {
  const [applications, setApplications] = useState([])
  const [selected, setSelected] = useState(null)
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '' })
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchApplications = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await api.get(`/applications${params}`)
      setApplications(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch applications')
    }
  }

  useEffect(() => { fetchApplications() }, [filter])

  const handleSelect = (app) => {
    setSelected(app)
    setStatusForm({ status: app.status, remarks: app.remarks || '' })
    setSuccessMsg('')
    setError('')
  }

  const handleStatusUpdate = async () => {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await api.put(`/applications/${selected._id}/status`, statusForm)
      setSuccessMsg(res.data.message)
      fetchApplications()
      setSelected(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this application?')) return
    try {
      await api.delete(`/applications/${id}`)
      fetchApplications()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete application')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Applications</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {successMsg && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{successMsg}</div>}

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['all', 'pending', 'under_review', 'accepted', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium border ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Program', 'Semester', 'Status', 'Submitted', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">No applications found</td></tr>
              ) : applications.map(app => (
                <tr key={app._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{app.name}</td>
                  <td className="px-4 py-3 text-gray-600">{app.email}</td>
                  <td className="px-4 py-3 text-gray-600">{app.programId?.code}</td>
                  <td className="px-4 py-3 text-gray-600">{app.semesterId?.schoolYear} {app.semesterId?.term}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[app.status]}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(app.submittedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => handleSelect(app)} className="text-blue-600 hover:underline text-xs">Review</button>
                    {app.status !== 'accepted' && (
                      <button onClick={() => handleDelete(app._id)} className="text-red-600 hover:underline text-xs">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Review Panel */}
        {selected && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Review Application — {selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><span className="text-gray-500">Email:</span> <span className="text-gray-800">{selected.email}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="text-gray-800">{selected.phone || '—'}</span></div>
              <div><span className="text-gray-500">Program:</span> <span className="text-gray-800">{selected.programId?.name}</span></div>
              <div><span className="text-gray-500">Semester:</span> <span className="text-gray-800">{selected.semesterId?.schoolYear} {selected.semesterId?.term}</span></div>
              <div><span className="text-gray-500">Birthdate:</span> <span className="text-gray-800">{selected.birthdate ? new Date(selected.birthdate).toLocaleDateString() : '—'}</span></div>
              <div><span className="text-gray-500">Address:</span> <span className="text-gray-800">{selected.address || '—'}</span></div>
            </div>

            {selected.documents?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">Documents</p>
                <div className="flex flex-wrap gap-2">
                  {selected.documents.map((doc, i) => (
                    <a key={i} href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline border border-blue-200 px-2 py-1 rounded">
                      {doc.docType}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selected.status !== 'accepted' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Update Status</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                  <textarea
                    value={statusForm.remarks}
                    onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            )}

            {selected.status === 'accepted' && (
              <p className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded border border-green-200">
                This application has been accepted and a student account has been created.
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}