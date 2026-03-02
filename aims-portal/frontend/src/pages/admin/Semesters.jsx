import { useState, useEffect } from 'react'
import api from '../../utils/api'

export default function Semesters() {
  const [semesters, setSemesters] = useState([])
  const [form, setForm] = useState({ schoolYear: '', term: '', startDate: '', endDate: '', isActive: false })
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchSemesters = async () => {
    try {
      const res = await api.get('/semesters')
      setSemesters(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch semesters')
    }
  }

  useEffect(() => { fetchSemesters() }, [])

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/semesters/${editing}`, form)
      } else {
        await api.post('/semesters', form)
      }
      setForm({ schoolYear: '', term: '', startDate: '', endDate: '', isActive: false })
      setEditing(null)
      setShowForm(false)
      fetchSemesters()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save semester')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (sem) => {
    setForm({
      schoolYear: sem.schoolYear,
      term: sem.term,
      startDate: sem.startDate?.slice(0, 10),
      endDate: sem.endDate?.slice(0, 10),
      isActive: sem.isActive
    })
    setEditing(sem._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this semester?')) return
    try {
      await api.delete(`/semesters/${id}`)
      fetchSemesters()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete semester')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Semesters</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ schoolYear: '', term: '', startDate: '', endDate: '', isActive: false }) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Semester'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editing ? 'Edit Semester' : 'New Semester'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">School Year</label>
              <input type="text" name="schoolYear" value={form.schoolYear} onChange={handleChange} placeholder="e.g. 2024-2025" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
              <input type="text" name="term" value={form.term} onChange={handleChange} placeholder="e.g. 1st Semester" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input type="checkbox" name="isActive" id="isActive" checked={form.isActive} onChange={handleChange} className="rounded" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Set as active semester</label>
          </div>
          <button type="submit" disabled={loading} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : editing ? 'Update Semester' : 'Create Semester'}
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['School Year', 'Term', 'Start Date', 'End Date', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {semesters.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-sm">No semesters found</td></tr>
            ) : semesters.map(s => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{s.schoolYear}</td>
                <td className="px-4 py-3 text-gray-600">{s.term}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(s.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(s.endDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}