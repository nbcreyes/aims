import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function StudentRecords() {
  const [students, setStudents] = useState([])
  const [programs, setPrograms] = useState([])
  const [selected, setSelected] = useState(null)
  const [editRecord, setEditRecord] = useState({ yearLevel: '', programId: '', status: '' })
  const [editProfile, setEditProfile] = useState({ phone: '', address: '', birthdate: '' })
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('record')

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students')
      setStudents(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students')
    }
  }

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/programs')
      setPrograms(res.data.data)
    } catch { }
  }

  useEffect(() => {
    fetchStudents()
    fetchPrograms()
  }, [])

  const handleSelect = async (studentId) => {
    try {
      const res = await api.get(`/students/${studentId}`)
      const data = res.data.data
      setSelected(data)
      setEditRecord({
        yearLevel: data.record?.yearLevel || '',
        programId: data.record?.programId?._id || '',
        status: data.user?.status || 'active'
      })
      setEditProfile({
        phone: data.profile?.phone || '',
        address: data.profile?.address || '',
        birthdate: data.profile?.birthdate?.slice(0, 10) || ''
      })
      setSuccess('')
      setError('')
      setActiveTab('record')
    } catch (err) {
      setError('Failed to load student details')
    }
  }

  const handleRecordUpdate = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.put(`/students/${selected.user._id}/record`, editRecord)
      setSuccess('Student record updated')
      fetchStudents()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update record')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.put(`/students/${selected.user._id}/profile`, editProfile)
      setSuccess('Profile updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const filtered = students.filter(s =>
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.record?.studentNo?.toLowerCase().includes(search.toLowerCase()) ||
    s.record?.programId?.code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Student Records</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        <div className="flex gap-6">
          {/* Left — Student List */}
          <div className="w-80 flex-shrink-0">
            <input
              type="text"
              placeholder="Search by name, student no, program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">No students found</p>
              ) : filtered.map(s => (
                <button
                  key={s.user._id}
                  onClick={() => handleSelect(s.user._id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selected?.user?._id === s.user._id ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-800">{s.user.name}</p>
                  <p className="text-xs text-gray-400">{s.record?.studentNo || 'No student no.'} — {s.record?.programId?.code || 'No program'}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${s.user.status === 'active' ? 'text-green-700' : 'text-gray-400'}`}>
                    {s.user.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right — Detail Panel */}
          {selected ? (
            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-800">{selected.user.name}</h2>
                <p className="text-sm text-gray-400">{selected.user.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Student No: <span className="font-medium text-gray-700">{selected.record?.studentNo}</span>
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                {['record', 'profile', 'enrollments'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Record Tab */}
              {activeTab === 'record' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Year Level</label>
                      <select
                        value={editRecord.yearLevel}
                        onChange={(e) => setEditRecord({ ...editRecord, yearLevel: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[1, 2, 3, 4, 5].map(y => (
                          <option key={y} value={y}>Year {y}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                      <select
                        value={editRecord.programId}
                        onChange={(e) => setEditRecord({ ...editRecord, programId: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select program</option>
                        {programs.map(p => (
                          <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Account Status</label>
                      <select
                        value={editRecord.status}
                        onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleRecordUpdate}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Record'}
                  </button>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                      <input
                        type="text"
                        value={editProfile.phone}
                        onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Birthdate</label>
                      <input
                        type="date"
                        value={editProfile.birthdate}
                        onChange={(e) => setEditProfile({ ...editProfile, birthdate: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                      <input
                        type="text"
                        value={editProfile.address}
                        onChange={(e) => setEditProfile({ ...editProfile, address: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              )}

              {/* Enrollments Tab */}
              {activeTab === 'enrollments' && (
                <div>
                  {selected.enrollments?.length === 0 ? (
                    <p className="text-sm text-gray-400">No enrollment history found.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.enrollments?.map(e => (
                        <div key={e._id} className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-md">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{e.semesterId?.schoolYear} — {e.semesterId?.term}</p>
                            <p className="text-xs text-gray-400">{e.programId?.name}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            e.status === 'approved' ? 'bg-green-100 text-green-700' :
                            e.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            e.status === 'dropped' ? 'bg-gray-100 text-gray-500' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {e.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-sm text-gray-400">Select a student to view their record</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}