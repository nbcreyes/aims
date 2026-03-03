import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const TERMS = ['1st Semester', '2nd Semester', 'Summer']

const emptyForm = {
  schoolYear: '',
  term: '1st Semester',
  startDate: '',
  endDate: '',
  isActive: false
}

export default function Semesters() {
  const [semesters, setSemesters] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

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
    setSuccess('')
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/semesters/${editing}`, form)
        setSuccess('Semester updated')
      } else {
        await api.post('/semesters', form)
        setSuccess('Semester created')
      }
      setForm(emptyForm)
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
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this semester?')) return
    try {
      await api.delete(`/semesters/${id}`)
      setSuccess('Semester deleted')
      fetchSemesters()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete semester')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Semesters</h1>
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditing(null)
              setForm(emptyForm)
              setError('')
              setSuccess('')
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Semester'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {editing ? 'Edit Semester' : 'New Semester'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">School Year</label>
                <input
                  type="text"
                  name="schoolYear"
                  value={form.schoolYear}
                  onChange={handleChange}
                  placeholder="e.g. 2024-2025"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
                <select
                  name="term"
                  value={form.term}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TERMS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Set as active semester
              </label>
            </div>

            {form.startDate && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Grade Lock Dates (auto-computed)</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-blue-600">
                  {(() => {
                    const start = new Date(form.startDate)
                    const week = 7 * 24 * 60 * 60 * 1000
                    const prelim = new Date(start.getTime() + (7 * week))
                    const midterm = new Date(start.getTime() + (13 * week))
                    const finals = new Date(start.getTime() + (19 * week))
                    return (
                      <>
                        <div>Prelim lock: <strong>{prelim.toLocaleDateString()}</strong></div>
                        <div>Midterm lock: <strong>{midterm.toLocaleDateString()}</strong></div>
                        <div>Finals lock: <strong>{finals.toLocaleDateString()}</strong></div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : editing ? 'Update Semester' : 'Create Semester'}
            </button>
          </form>
        )}

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['School Year', 'Term', 'Start Date', 'End Date', 'Grade Lock Dates', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {semesters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">
                    No semesters found
                  </td>
                </tr>
              ) : semesters.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.schoolYear}</td>
                  <td className="px-4 py-3 text-gray-600">{s.term}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(s.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(s.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {s.lockDates ? (
                      <div className="space-y-0.5">
                        <div>Prelim: <span className="text-gray-700">{new Date(s.lockDates.prelim).toLocaleDateString()}</span></div>
                        <div>Midterm: <span className="text-gray-700">{new Date(s.lockDates.midterm).toLocaleDateString()}</span></div>
                        <div>Finals: <span className="text-gray-700">{new Date(s.lockDates.finals).toLocaleDateString()}</span></div>
                      </div>
                    ) : '—'}
                  </td>
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
    </DashboardLayout>
  )
}