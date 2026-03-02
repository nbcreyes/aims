import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const ROLES = ['all', 'student', 'teacher', 'parent', 'cashier', 'registrar']

const emptyForm = { title: '', content: '', targetRole: 'all', targetProgramId: '' }

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [programs, setPrograms] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/all')
      setAnnouncements(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch announcements')
    }
  }

  useEffect(() => {
    fetchAnnouncements()
    const fetchPrograms = async () => {
      try {
        const res = await api.get('/programs')
        setPrograms(res.data.data)
      } catch { }
    }
    fetchPrograms()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        targetProgramId: form.targetProgramId || null
      }
      if (editing) {
        await api.put(`/announcements/${editing}`, payload)
        setSuccess('Announcement updated')
      } else {
        await api.post('/announcements', payload)
        setSuccess('Announcement created')
      }
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      fetchAnnouncements()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save announcement')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (a) => {
    setForm({
      title: a.title,
      content: a.content,
      targetRole: a.targetRole || 'all',
      targetProgramId: a.targetProgramId?._id || ''
    })
    setEditing(a._id)
    setShowForm(true)
    setSelected(null)
    setError('')
    setSuccess('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await api.delete(`/announcements/${id}`)
      setSuccess('Announcement deleted')
      if (selected?._id === id) setSelected(null)
      fetchAnnouncements()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Announcements</h1>
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
            {showForm ? 'Cancel' : 'New Announcement'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {editing ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Target Role</label>
                  <select
                    name="targetRole"
                    value={form.targetRole}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Target Program (optional)</label>
                  <select
                    name="targetProgramId"
                    value={form.targetProgramId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Programs</option>
                    {programs.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : editing ? 'Update' : 'Post Announcement'}
            </button>
          </form>
        )}

        <div className="flex gap-6">
          {/* List */}
          <div className="flex-1 space-y-3">
            {announcements.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-40">
                <p className="text-sm text-gray-400">No announcements yet</p>
              </div>
            ) : announcements.map(a => (
              <div
                key={a._id}
                className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors ${selected?._id === a._id ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setSelected(selected?._id === a._id ? null : a)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(a.createdAt).toLocaleDateString()} — by {a.createdBy?.name}
                    </p>
                    <div className="flex gap-2 mt-1.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                        {a.targetRole}
                      </span>
                      {a.targetProgramId && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                          {a.targetProgramId.code}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(a) }}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(a._id) }}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {selected?._id === a._id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}