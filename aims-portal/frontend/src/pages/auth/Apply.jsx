import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

// Use axios directly without auth headers — these are public endpoints
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
})

const DOC_FIELDS = [
  { label: 'Form 138 / Report Card', name: 'form138' },
  { label: 'Birth Certificate', name: 'birthCertificate' },
  { label: 'Good Moral Certificate', name: 'goodMoral' },
  { label: 'Valid ID', name: 'validId' }
]

export default function Apply() {
  const [programs, setPrograms] = useState([])
  const [semesters, setSemesters] = useState([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthdate: '',
    programId: '',
    semesterId: ''
  })
  const [files, setFiles] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingDropdowns, setLoadingDropdowns] = useState(true)

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          publicApi.get('/programs/public'),
          publicApi.get('/semesters/public')
        ])
        // Only show active programs and active semesters
        setPrograms(pRes.data.data.filter(p => p.status === 'active'))
        setSemesters(sRes.data.data.filter(s => s.isActive))
      } catch {
        setError('Failed to load programs and semesters. Please refresh the page.')
      } finally {
        setLoadingDropdowns(false)
      }
    }
    fetchPublicData()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, val]) => formData.append(key, val))
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file)
      })

      await publicApi.post('/applications/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Application Submitted</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your application has been received. You will be notified via email once it has been reviewed.
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Student Application</h1>
        <p className="text-sm text-gray-500 mb-6">AIMS — Academic Integrated Management System</p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Personal Info */}
          <div>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
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

          {/* Program */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
            {loadingDropdowns ? (
              <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-400 bg-gray-50">
                Loading programs...
              </div>
            ) : (
              <select
                name="programId"
                value={form.programId}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a program</option>
                {programs.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            )}
            {!loadingDropdowns && programs.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No active programs available. Please contact the admissions office.
              </p>
            )}
          </div>

          {/* Semester */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
            {loadingDropdowns ? (
              <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-400 bg-gray-50">
                Loading semesters...
              </div>
            ) : (
              <select
                name="semesterId"
                value={form.semesterId}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a semester</option>
                {semesters.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.schoolYear} — {s.term}
                  </option>
                ))}
              </select>
            )}
            {!loadingDropdowns && semesters.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No active semester at this time. Please check back later.
              </p>
            )}
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">
              Supporting Documents
              <span className="text-gray-400 font-normal ml-1">(JPG, PNG, or PDF — max 5MB each)</span>
            </p>
            <div className="space-y-3">
              {DOC_FIELDS.map(doc => (
                <div key={doc.name} className="border border-gray-200 rounded-md p-3">
                  <label className="block text-xs text-gray-600 mb-1">{doc.label}</label>
                  <input
                    type="file"
                    name={doc.name}
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="w-full text-xs text-gray-600"
                  />
                  {files[doc.name] && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {files[doc.name].name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || loadingDropdowns}
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-1">
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}