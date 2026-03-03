import { useState, useEffect, useRef } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [studentRecord, setStudentRecord] = useState(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    birthdate: '',
    bio: ''
  })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me')
      const { user, profile, studentRecord } = res.data.data
      setUser(user)
      setProfile(profile)
      setStudentRecord(studentRecord)
      setForm({
        name: user.name || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        birthdate: profile?.birthdate ? profile.birthdate.slice(0, 10) : '',
        bio: profile?.bio || ''
      })
      if (profile?.avatar) {
        setAvatarPreview(
          `${import.meta.env.VITE_API_URL.replace('/api', '')}${profile.avatar}`
        )
      }
    } catch (err) {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('phone', form.phone)
      formData.append('address', form.address)
      formData.append('birthdate', form.birthdate)
      formData.append('bio', form.bio)
      if (avatarFile) {
        formData.append('avatar', avatarFile)
      }

      await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess('Profile updated successfully')
      setAvatarFile(null)
      fetchProfile()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <p className="text-sm text-gray-400">Loading profile...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-800 mb-6">My Profile</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden cursor-pointer border-2 border-gray-200 hover:border-blue-400 transition-colors flex items-center justify-center bg-blue-50 flex-shrink-0"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-bold text-xl">
                    {getInitials(form.name)}
                  </span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Upload new photo
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG or WEBP — max 2MB</p>
                {avatarFile && (
                  <p className="text-xs text-green-600 mt-1">
                    {avatarFile.name} selected — save to apply
                  </p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Account Info (read only) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Account Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-800">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <p className="text-sm font-medium text-gray-800 capitalize">{user?.role}</p>
              </div>
              {studentRecord && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Student No</p>
                    <p className="text-sm font-medium text-gray-800">{studentRecord.studentNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Program</p>
                    <p className="text-sm font-medium text-gray-800">
                      {studentRecord.programId?.name} ({studentRecord.programId?.code})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Year Level</p>
                    <p className="text-sm font-medium text-gray-800">Year {studentRecord.yearLevel}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Editable Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. 09171234567"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Birthdate</label>
                <input
                  type="date"
                  name="birthdate"
                  value={form.birthdate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="e.g. 123 Main St, Pasay City, Metro Manila"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="A short description about yourself..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}