import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer']
const YEAR_LEVELS = [1, 2, 3, 4, 5]

const emptyForm = {
  subjectId: '',
  yearLevel: 1,
  semester: '1st Semester',
  order: 0,
  prerequisites: [],
  corequisites: [],
  isRequired: true
}

export default function Curriculum() {
  const [programs, setPrograms] = useState([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [curriculum, setCurriculum] = useState([])
  const [grouped, setGrouped] = useState({})
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/programs').then(res => setPrograms(res.data.data)).catch(() => {})
    api.get('/subjects').then(res => setSubjects(res.data.data)).catch(() => {})
  }, [])

  const fetchCurriculum = async (programId) => {
    try {
      const res = await api.get(`/curriculum?programId=${programId}`)
      setCurriculum(res.data.data)
      setGrouped(res.data.grouped)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch curriculum')
    }
  }

  const handleProgramChange = (e) => {
    setSelectedProgram(e.target.value)
    setCurriculum([])
    setGrouped({})
    if (e.target.value) fetchCurriculum(e.target.value)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleMultiSelect = (name, value) => {
    const current = form[name]
    if (current.includes(value)) {
      setForm({ ...form, [name]: current.filter(v => v !== value) })
    } else {
      setForm({ ...form, [name]: [...current, value] })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/curriculum/${editing}`, form)
        setSuccess('Curriculum entry updated')
      } else {
        await api.post('/curriculum', { ...form, programId: selectedProgram })
        setSuccess('Subject added to curriculum')
      }
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      fetchCurriculum(selectedProgram)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (entry) => {
    setForm({
      subjectId: entry.subjectId?._id || '',
      yearLevel: entry.yearLevel,
      semester: entry.semester,
      order: entry.order || 0,
      prerequisites: entry.prerequisites?.map(p => p._id) || [],
      corequisites: entry.corequisites?.map(c => c._id) || [],
      isRequired: entry.isRequired
    })
    setEditing(entry._id)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this subject from the curriculum?')) return
    try {
      await api.delete(`/curriculum/${id}`)
      setSuccess('Entry removed')
      fetchCurriculum(selectedProgram)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove')
    }
  }

  // Subjects already in curriculum (to exclude from add form)
  const usedSubjectIds = curriculum.map(c => c.subjectId?._id?.toString())
  const availableSubjects = subjects.filter(s =>
    !usedSubjectIds.includes(s._id.toString()) || editing
  )

  // Subjects that can be prerequisites/corequisites
  // (subjects already in curriculum except the current one being edited)
  const prereqOptions = curriculum.filter(c =>
    c.subjectId?._id?.toString() !== form.subjectId
  )

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Curriculum</h1>
          {selectedProgram && (
            <button
              onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); setError(''); setSuccess('') }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              {showForm ? 'Cancel' : 'Add Subject'}
            </button>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        {/* Program Selector */}
        <div className="mb-6">
          <select
            value={selectedProgram}
            onChange={handleProgramChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a program to view curriculum</option>
            {programs.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>

        {/* Add / Edit Form */}
        {showForm && selectedProgram && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {editing ? 'Edit Curriculum Entry' : 'Add Subject to Curriculum'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <select name="subjectId" value={form.subjectId} onChange={handleChange} required
                  disabled={!!editing}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
                  <option value="">Select subject</option>
                  {availableSubjects.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.code} — {s.name} ({s.units} units) [{s.departmentId?.code}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year Level</label>
                <select name="yearLevel" value={form.yearLevel} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {YEAR_LEVELS.map(y => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                <select name="semester" value={form.semester} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {SEMESTERS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
                <input type="number" name="order" value={form.order} onChange={handleChange} min={0}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" name="isRequired" id="isRequired"
                  checked={form.isRequired} onChange={handleChange}
                  className="rounded border-gray-300" />
                <label htmlFor="isRequired" className="text-sm text-gray-700">Required subject</label>
              </div>
            </div>

            {/* Prerequisites */}
            {prereqOptions.length > 0 && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Prerequisites
                  <span className="text-gray-400 font-normal ml-1">(must be passed before taking this subject)</span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                  {prereqOptions.map(entry => (
                    <label key={entry._id} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.prerequisites.includes(entry.subjectId?._id?.toString())}
                        onChange={() => handleMultiSelect('prerequisites', entry.subjectId?._id?.toString())}
                        className="rounded border-gray-300"
                      />
                      {entry.subjectId?.code}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Corequisites */}
            {prereqOptions.length > 0 && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Co-requisites
                  <span className="text-gray-400 font-normal ml-1">(must be taken in the same semester)</span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                  {prereqOptions.map(entry => (
                    <label key={entry._id} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.corequisites.includes(entry.subjectId?._id?.toString())}
                        onChange={() => handleMultiSelect('corequisites', entry.subjectId?._id?.toString())}
                        className="rounded border-gray-300"
                      />
                      {entry.subjectId?.code}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : editing ? 'Update Entry' : 'Add to Curriculum'}
            </button>
          </form>
        )}

        {/* Curriculum Table — grouped by year and semester */}
        {selectedProgram && Object.keys(grouped).length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 text-center">
            <p className="text-sm text-gray-400">No curriculum defined for this program yet.</p>
            <p className="text-xs text-gray-300 mt-1">Click Add Subject to start building the curriculum.</p>
          </div>
        )}

        {Object.entries(grouped).map(([groupKey, entries]) => (
          <div key={groupKey} className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2 px-1">{groupKey}</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Code', 'Subject', 'Dept', 'Units', 'Type', 'Required', 'Prerequisites', 'Co-reqs', 'Actions'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.map(entry => (
                    <tr key={entry._id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-mono text-xs font-medium text-gray-800">
                        {entry.subjectId?.code}
                      </td>
                      <td className="px-3 py-3 text-gray-800">{entry.subjectId?.name}</td>
                      <td className="px-3 py-3 text-gray-500 text-xs">{entry.subjectId?.departmentId?.code}</td>
                      <td className="px-3 py-3 text-gray-600">{entry.subjectId?.units}</td>
                      <td className="px-3 py-3 text-gray-600 capitalize">{entry.subjectId?.type}</td>
                      <td className="px-3 py-3">
                        {entry.isRequired ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Required</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Elective</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {entry.prerequisites?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {entry.prerequisites.map(p => (
                              <span key={p._id} className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                {p.code}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {entry.corequisites?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {entry.corequisites.map(c => (
                              <span key={c._id} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                {c.code}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 space-x-2">
                        <button onClick={() => handleEdit(entry)} className="text-blue-600 hover:underline text-xs">Edit</button>
                        <button onClick={() => handleDelete(entry._id)} className="text-red-600 hover:underline text-xs">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={9} className="px-3 py-2 text-xs text-gray-500">
                      Total units: <strong>{entries.reduce((sum, e) => sum + (e.subjectId?.units || 0), 0)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}