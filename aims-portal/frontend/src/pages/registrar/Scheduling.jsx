import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const emptyForm = {
  subjectId: '', sectionId: '', semesterId: '', teacherId: '',
  day: 'Monday', timeStart: '', timeEnd: '', room: ''
}

export default function Scheduling() {
  const [schedules, setSchedules] = useState([])
  const [semesters, setSemesters] = useState([])
  const [subjects, setSubjects] = useState([])
  const [sections, setSections] = useState([])
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [filterSemester, setFilterSemester] = useState('')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchDropdowns = async () => {
    try {
      const [semRes, subRes, secRes, userRes] = await Promise.all([
        api.get('/semesters'),
        api.get('/subjects'),
        api.get('/sections'),
        api.get('/users?role=teacher')
      ])
      setSemesters(semRes.data.data)
      setSubjects(subRes.data.data)
      setSections(secRes.data.data)
      setTeachers(userRes.data.data)

      const active = semRes.data.data.find(s => s.isActive)
      if (active) setFilterSemester(active._id)
    } catch (err) {
      setError('Failed to load form data')
    }
  }

  const fetchSchedules = async () => {
    try {
      const params = filterSemester ? `?semesterId=${filterSemester}` : ''
      const res = await api.get(`/schedules${params}`)
      setSchedules(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch schedules')
    }
  }

  useEffect(() => { fetchDropdowns() }, [])
  useEffect(() => { if (filterSemester) fetchSchedules() }, [filterSemester])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/schedules/${editing}`, form)
      } else {
        await api.post('/schedules', form)
      }
      setForm(emptyForm)
      setEditing(null)
      setShowForm(false)
      fetchSchedules()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (s) => {
    setForm({
      subjectId: s.subjectId?._id || '',
      sectionId: s.sectionId?._id || '',
      semesterId: s.semesterId?._id || '',
      teacherId: s.teacherId?._id || '',
      day: s.day,
      timeStart: s.timeStart,
      timeEnd: s.timeEnd,
      room: s.room
    })
    setEditing(s._id)
    setShowForm(true)
    setError('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this schedule?')) return
    try {
      await api.delete(`/schedules/${id}`)
      fetchSchedules()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete schedule')
    }
  }

  const filteredSections = form.semesterId
    ? sections.filter(s => s.semesterId?._id === form.semesterId || s.semesterId === form.semesterId)
    : sections

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Class Scheduling</h1>
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); setError('') }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Schedule'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">{editing ? 'Edit Schedule' : 'New Schedule'}</h2>
            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                <select name="semesterId" value={form.semesterId} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select semester</option>
                  {semesters.map(s => <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Section</label>
                <select name="sectionId" value={form.sectionId} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select section</option>
                  {filteredSections.map(s => <option key={s._id} value={s._id}>{s.name} — Year {s.yearLevel} ({s.programId?.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                <select name="subjectId" value={form.subjectId} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.code} — {s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teacher</label>
                <select name="teacherId" value={form.teacherId} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
                <select name="day" value={form.day} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Room</label>
                <input type="text" name="room" value={form.room} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time Start</label>
                <input type="time" name="timeStart" value={form.timeStart} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time End</label>
                <input type="time" name="timeEnd" value={form.timeEnd} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

            </div>
            <button type="submit" disabled={loading}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : editing ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </form>
        )}

        {/* Filter */}
        <div className="mb-4">
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select semester to view</option>
            {semesters.map(s => <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Subject', 'Section', 'Teacher', 'Day', 'Time', 'Room', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400 text-sm">No schedules found</td></tr>
              ) : schedules.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{s.subjectId?.name}</p>
                    <p className="text-xs text-gray-400">{s.subjectId?.code}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.sectionId?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.teacherId?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.day}</td>
                  <td className="px-4 py-3 text-gray-600">{s.timeStart} – {s.timeEnd}</td>
                  <td className="px-4 py-3 text-gray-600">{s.room}</td>
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