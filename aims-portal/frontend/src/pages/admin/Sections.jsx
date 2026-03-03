import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function Sections() {
  const [sections, setSections] = useState([])
  const [programs, setPrograms] = useState([])
  const [semesters, setSemesters] = useState([])
  const [form, setForm] = useState({
    programId: '',
    semesterId: '',
    yearLevel: '',
    sectionNumber: '',
    capacity: 40
  })
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterProgram, setFilterProgram] = useState('')
  const [filterSemester, setFilterSemester] = useState('')

  const fetchSections = async () => {
    try {
      const params = new URLSearchParams()
      if (filterProgram) params.append('programId', filterProgram)
      if (filterSemester) params.append('semesterId', filterSemester)
      const res = await api.get(`/sections?${params}`)
      setSections(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sections')
    }
  }

  useEffect(() => {
    fetchSections()
    api.get('/programs').then(res => setPrograms(res.data.data)).catch(() => {})
    api.get('/semesters').then(res => setSemesters(res.data.data)).catch(() => {})
  }, [])

  useEffect(() => { fetchSections() }, [filterProgram, filterSemester])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/sections/${editing}`, {
          sectionNumber: form.sectionNumber,
          capacity: form.capacity
        })
        setSuccess('Section updated')
      } else {
        const res = await api.post('/sections', form)
        setSuccess(`Section ${res.data.data.name} created successfully`)
      }
      setForm({ programId: '', semesterId: '', yearLevel: '', sectionNumber: '', capacity: 40 })
      setEditing(null)
      setShowForm(false)
      fetchSections()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save section')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (s) => {
    setForm({
      programId: s.programId?._id || '',
      semesterId: s.semesterId?._id || '',
      yearLevel: s.yearLevel,
      sectionNumber: s.sectionNumber,
      capacity: s.capacity
    })
    setEditing(s._id)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this section?')) return
    try {
      await api.delete(`/sections/${id}`)
      setSuccess('Section deleted')
      fetchSections()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete section')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Sections</h1>
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ programId: '', semesterId: '', yearLevel: '', sectionNumber: '', capacity: 40 }); setError(''); setSuccess('') }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Section'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">
              {editing ? 'Edit Section' : 'New Section'}
            </h2>
            {!editing && (
              <p className="text-xs text-gray-400 mb-4">
                Section name will be auto-generated — e.g. CS11S1 (CS, Year 1, Sem 1, Section 1)
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                <select name="programId" value={form.programId} onChange={handleChange}
                  required disabled={!!editing}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                  <option value="">Select program</option>
                  {programs.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                <select name="semesterId" value={form.semesterId} onChange={handleChange}
                  required disabled={!!editing}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                  <option value="">Select semester</option>
                  {semesters.map(s => (
                    <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year Level</label>
                <select name="yearLevel" value={form.yearLevel} onChange={handleChange}
                  required disabled={!!editing}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                  <option value="">Select year</option>
                  {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Section Number</label>
                <input type="number" name="sectionNumber" value={form.sectionNumber}
                  onChange={handleChange} required min={1} max={20}
                  placeholder="e.g. 1, 2, 3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Capacity</label>
                <input type="number" name="capacity" value={form.capacity}
                  onChange={handleChange} min={1} max={100}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : editing ? 'Update Section' : 'Create Section'}
            </button>
          </form>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Programs</option>
            {programs.map(p => <option key={p._id} value={p._id}>{p.code}</option>)}
          </select>
          <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Semesters</option>
            {semesters.map(s => <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>)}
          </select>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Section', 'Program', 'Semester', 'Year', 'Capacity', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sections.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">No sections found</td></tr>
              ) : sections.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.programId?.code}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.semesterId?.schoolYear} {s.semesterId?.term}</td>
                  <td className="px-4 py-3 text-gray-600">Year {s.yearLevel}</td>
                  <td className="px-4 py-3 text-gray-600">{s.capacity}</td>
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