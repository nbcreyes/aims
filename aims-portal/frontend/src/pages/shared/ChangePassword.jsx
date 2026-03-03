import { useState } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    if (form.currentPassword === form.newPassword) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      setSuccess('Password changed successfully')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const PasswordInput = ({ name, label, show, onToggle }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={form[name]}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="p-6 max-w-md">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Change Password</h1>

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

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <PasswordInput
            name="currentPassword"
            label="Current Password"
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />
          <PasswordInput
            name="newPassword"
            label="New Password"
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password strength indicator */}
          {form.newPassword && (
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${
                    form.newPassword.length >= i * 3
                      ? i <= 1 ? 'bg-red-400'
                      : i <= 2 ? 'bg-yellow-400'
                      : i <= 3 ? 'bg-blue-400'
                      : 'bg-green-400'
                      : 'bg-gray-200'
                  }`} />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {form.newPassword.length < 8 ? 'Too short — minimum 8 characters' :
                 form.newPassword.length < 10 ? 'Weak' :
                 form.newPassword.length < 12 ? 'Good' : 'Strong'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}