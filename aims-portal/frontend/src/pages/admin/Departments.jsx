import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const emptyForm = { name: '', code: '', college: '', status: 'active' }

export default function Departments() {
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments')
      setDepartments(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch departments')
    }
  }

  useEffect(() => { fetchDepartments() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/departments/${editing}`, form)
        setSuccess('Department updated')
      } else {
        await api.post('/departments', form)
        setSuccess('Department created')
      }
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      fetchDepartments()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save department')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (d) => {
    setForm({ name: d.name, code: d.code, college: d.college, status: d.status })
    setEditing(d._id)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return
    try {
      await api.delete(`/departments/${id}`)
      setSuccess('Department deleted')
      fetchDepartments()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete department')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Departments</h1>
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); setError(''); setSuccess('') }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Department'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {editing ? 'Edit Department' : 'New Department'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Department Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Code</label>
                <input type="text" name="code" value={form.code} onChange={handleChange} required
                  placeholder="e.g. CCS, CAS, COE"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">College</label>
                <input type="text" name="college" value={form.college} onChange={handleChange} required
                  placeholder="e.g. College of Computer Studies"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : editing ? 'Update' : 'Create Department'}
            </button>
          </form>
        )}

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Code', 'Name', 'College', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {departments.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">No departments found</td></tr>
              ) : departments.map(d => (
                <tr key={d._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-800">{d.code}</td>
                  <td className="px-4 py-3 text-gray-800">{d.name}</td>
                  <td className="px-4 py-3 text-gray-500">{d.college}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => handleEdit(d)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(d._id)} className="text-red-600 hover:underline text-xs">Delete</button>
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