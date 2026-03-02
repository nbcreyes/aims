import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const emptyForm = {
  programId: '',
  code: '',
  name: '',
  units: '',
  yearLevel: '',
  term: '',
  hasLab: false,
  labFee: 0,
  status: 'active'
}

const TERMS = ['First Semester', 'Second Semester', 'Summer']

export default function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [programs, setPrograms] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filterProgram, setFilterProgram] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchSubjects = async () => {
    try {
      const params = filterProgram ? `?programId=${filterProgram}` : ''
      const res = await api.get(`/subjects${params}`)
      setSubjects(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subjects')
    }
  }

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/programs')
      setPrograms(res.data.data)
    } catch { }
  }

  useEffect(() => { fetchPrograms() }, [])
  useEffect(() => { fetchSubjects() }, [filterProgram])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/subjects/${editing}`, form)
        setSuccess('Subject updated')
      } else {
        await api.post('/subjects', form)
        setSuccess('Subject created')
      }
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      fetchSubjects()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subject')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (s) => {
    setForm({
      programId: s.programId?._id || s.programId || '',
      code: s.code,
      name: s.name,
      units: s.units,
      yearLevel: s.yearLevel,
      term: s.term,
      hasLab: s.hasLab || false,
      labFee: s.labFee || 0,
      status: s.status
    })
    setEditing(s._id)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return
    try {
      await api.delete(`/subjects/${id}`)
      setSuccess('Subject deleted')
      fetchSubjects()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete subject')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Subjects</h1>
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); setError(''); setSuccess('') }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Subject'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {editing ? 'Edit Subject' : 'New Subject'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                <select
                  name="programId"
                  value={form.programId}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select program</option>
                  {programs.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject Code</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Units</label>
                <input
                  type="number"
                  name="units"
                  value={form.units}
                  onChange={handleChange}
                  required
                  min={1}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year Level</label>
                <select
                  name="yearLevel"
                  value={form.yearLevel}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select year</option>
                  {[1, 2, 3, 4, 5].map(y => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
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
                  <option value="">Select term</option>
                  {TERMS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-5">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="hasLab"
                    checked={form.hasLab}
                    onChange={handleChange}
                    className="rounded border-gray-300"
                  />
                  Has Lab
                </label>
                {form.hasLab && (
                  <div className="flex-1">
                    <input
                      type="number"
                      name="labFee"
                      value={form.labFee}
                      onChange={handleChange}
                      placeholder="Lab fee"
                      min={0}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : editing ? 'Update Subject' : 'Create Subject'}
            </button>
          </form>
        )}

        {/* Filter */}
        <div className="mb-4">
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Programs</option>
            {programs.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Code', 'Name', 'Program', 'Year', 'Term', 'Units', 'Lab', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subjects.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400 text-sm">No subjects found</td></tr>
              ) : subjects.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-800">{s.code}</td>
                  <td className="px-4 py-3 text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.programId?.code || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">Year {s.yearLevel}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.term}</td>
                  <td className="px-4 py-3 text-gray-600">{s.units}</td>
                  <td className="px-4 py-3">
                    {s.hasLab ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Lab ₱{s.labFee?.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.status}
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