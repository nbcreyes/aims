import { useState, useEffect } from 'react'
import api from '../../utils/api'

export default function Apply() {
  const [programs, setPrograms] = useState([])
  const [semesters, setSemesters] = useState([])
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', birthdate: '', programId: '', semesterId: ''
  })
  const [files, setFiles] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes] = await Promise.all([api.get('/programs'), api.get('/semesters')])
        setPrograms(pRes.data.data.filter(p => p.status === 'active'))
        setSemesters(sRes.data.data.filter(s => s.isActive))
      } catch {
        setError('Failed to load form data')
      }
    }
    fetchData()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, val]) => formData.append(key, val))
      Object.entries(files).forEach(([key, file]) => formData.append(key, file))

      await api.post('/applications/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess('Application submitted successfully. You will be contacted via email once reviewed.')
      setForm({ name: '', email: '', phone: '', address: '', birthdate: '', programId: '', semesterId: '' })
      setFiles({})
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Student Application</h1>
        <p className="text-sm text-gray-500 mb-6">AIMS — Academic Integrated Management System</p>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', name: 'name', type: 'text' },
              { label: 'Email Address', name: 'email', type: 'email' },
              { label: 'Phone Number', name: 'phone', type: 'text' },
              { label: 'Address', name: 'address', type: 'text' },
              { label: 'Birthdate', name: 'birthdate', type: 'date' }
            ].map(field => (
              <div key={field.name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={['name', 'email'].includes(field.name)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
              <select name="programId" value={form.programId} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a program</option>
                {programs.map(p => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
              <select name="semesterId" value={form.semesterId} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a semester</option>
                {semesters.map(s => <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>)}
              </select>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Documents</p>
              <div className="space-y-2">
                {[
                  { label: 'Form 138 / Report Card', name: 'form138' },
                  { label: 'Birth Certificate', name: 'birthCertificate' },
                  { label: 'Good Moral Certificate', name: 'goodMoral' },
                  { label: 'Valid ID', name: 'validId' }
                ].map(doc => (
                  <div key={doc.name}>
                    <label className="block text-xs text-gray-500 mb-1">{doc.label}</label>
                    <input
                      type="file"
                      name={doc.name}
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="w-full text-xs text-gray-600 border border-gray-300 rounded-md px-3 py-1.5"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}

        <p className="text-xs text-gray-400 mt-6 text-center">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}