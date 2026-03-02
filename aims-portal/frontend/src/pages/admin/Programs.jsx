import { useState, useEffect } from 'react'
import api from '../../utils/api'

export default function Programs() {
  const [programs, setPrograms] = useState([])
  const [form, setForm] = useState({ name: '', code: '', department: '', years: '', pricePerUnit: '', miscFee: '' })
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/programs')
      setPrograms(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch programs')
    }
  }

  useEffect(() => { fetchPrograms() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/programs/${editing}`, form)
      } else {
        await api.post('/programs', form)
      }
      setForm({ name: '', code: '', department: '', years: '', pricePerUnit: '', miscFee: '' })
      setEditing(null)
      setShowForm(false)
      fetchPrograms()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save program')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (program) => {
    setForm({
      name: program.name,
      code: program.code,
      department: program.department,
      years: program.years,
      pricePerUnit: program.pricePerUnit,
      miscFee: program.miscFee
    })
    setEditing(program._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this program?')) return
    try {
      await api.delete(`/programs/${id}`)
      fetchPrograms()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete program')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Programs</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', code: '', department: '', years: '', pricePerUnit: '', miscFee: '' }) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add Program'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{editing ? 'Edit Program' : 'New Program'}</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Program Name', name: 'name', type: 'text' },
              { label: 'Code', name: 'code', type: 'text' },
              { label: 'Department', name: 'department', type: 'text' },
              { label: 'Years', name: 'years', type: 'number' },
              { label: 'Price Per Unit', name: 'pricePerUnit', type: 'number' },
              { label: 'Misc Fee', name: 'miscFee', type: 'number' }
            ].map(field => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : editing ? 'Update Program' : 'Create Program'}
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Code', 'Department', 'Years', 'Price/Unit', 'Misc Fee', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {programs.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400 text-sm">No programs found</td></tr>
            ) : programs.map(p => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.code}</td>
                <td className="px-4 py-3 text-gray-600">{p.department}</td>
                <td className="px-4 py-3 text-gray-600">{p.years}</td>
                <td className="px-4 py-3 text-gray-600">{p.pricePerUnit}</td>
                <td className="px-4 py-3 text-gray-600">{p.miscFee}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}