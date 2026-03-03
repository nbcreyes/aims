import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'
import useAuth from '../../hooks/useAuth'

const ELIGIBILITY_STYLES = {
  eligible: { badge: 'bg-green-100 text-green-700', label: 'Eligible' },
  retake: { badge: 'bg-yellow-100 text-yellow-700', label: 'Retake' },
  elective: { badge: 'bg-purple-100 text-purple-700', label: 'Elective' },
  blocked: { badge: 'bg-red-100 text-red-700', label: 'Blocked' },
  passed: { badge: 'bg-gray-100 text-gray-500', label: 'Passed' },
  enrolled: { badge: 'bg-blue-100 text-blue-700', label: 'Enrolled' }
}

const STATUS_COLORS = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  dropped: 'bg-gray-100 text-gray-500'
}

export default function Enrollment() {
  const { user } = useAuth()
  const [semesters, setSemesters] = useState([])
  const [activeSemester, setActiveSemester] = useState(null)
  const [selectedSemester, setSelectedSemester] = useState('')
  const [available, setAvailable] = useState([])
  const [myEnrollments, setMyEnrollments] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState([])
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState('enroll')
  const [filterEligibility, setFilterEligibility] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/semesters')
        setSemesters(res.data.data)
        const active = res.data.data.find(s => s.isActive)
        if (active) {
          setActiveSemester(active)
          setSelectedSemester(active._id)
        }
      } catch {}
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedSemester) return
    fetchAvailable()
    fetchMyEnrollments()
  }, [selectedSemester])

  const fetchAvailable = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/enrollments/available?semesterId=${selectedSemester}`)
      setAvailable(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyEnrollments = async () => {
    try {
      const res = await api.get(`/enrollments/my?semesterId=${selectedSemester}`)
      setMyEnrollments(res.data.data)
    } catch {}
  }

  const toggleSelect = (scheduleId) => {
    setSelected(prev =>
      prev.includes(scheduleId)
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    )
  }

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Please select at least one subject')
      return
    }
    setSubmitting(true)
    setError('')
    setErrors([])
    setSuccess('')
    try {
      await api.post('/enrollments', {
        scheduleIds: selected,
        semesterId: selectedSemester
      })
      setSuccess(`Successfully submitted enrollment for ${selected.length} subject(s). Awaiting registrar approval.`)
      setSelected([])
      fetchAvailable()
      fetchMyEnrollments()
      setTab('my')
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else {
        setError(err.response?.data?.message || 'Failed to submit enrollment')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = available.filter(item => {
    const matchEligibility = filterEligibility === 'all' || item.eligibility === filterEligibility
    const matchSearch = search === '' ||
      item.schedule.subjectId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.schedule.subjectId?.code?.toLowerCase().includes(search.toLowerCase())
    return matchEligibility && matchSearch
  })

  const totalSelectedUnits = selected.reduce((sum, id) => {
    const item = available.find(a => a.schedule._id === id)
    return sum + (item?.schedule.subjectId?.units || 0)
  }, 0)

  const allApproved = myEnrollments.length > 0 && myEnrollments.every(e => e.status === 'approved')

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Enrollment</h1>

        {/* Semester Selector */}
        <div className="mb-5">
          <select
            value={selectedSemester}
            onChange={e => { setSelectedSemester(e.target.value); setSelected([]) }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select semester</option>
            {semesters.map(s => (
              <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 border-b border-gray-200">
          {[
            { key: 'enroll', label: 'Available Subjects' },
            { key: 'my', label: `My Enrollments (${myEnrollments.length})` }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4">
            <p className="text-sm font-semibold text-red-700 mb-2">Enrollment cannot be submitted:</p>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((e, i) => (
                <li key={i} className="text-sm text-red-600">{e}</li>
              ))}
            </ul>
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">
            {success}
          </div>
        )}

        {/* ── Available Subjects Tab ── */}
        {tab === 'enroll' && (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              <input
                type="text"
                placeholder="Search subject..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
              <select
                value={filterEligibility}
                onChange={e => setFilterEligibility(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Subjects</option>
                <option value="eligible">Eligible</option>
                <option value="retake">Retake</option>
                <option value="elective">Elective</option>
                <option value="blocked">Blocked</option>
                <option value="passed">Passed</option>
                <option value="enrolled">Already Enrolled</option>
              </select>
            </div>

            {loading ? (
              <div className="bg-white border border-gray-200 rounded-lg px-6 py-8 text-center">
                <p className="text-sm text-gray-400">Loading available subjects...</p>
              </div>
            ) : (
              <>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="w-10 px-4 py-3"></th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Subject</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Section</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Teacher</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Schedule</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Units</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                            No subjects found
                          </td>
                        </tr>
                      ) : filtered.map(item => {
                        const { schedule, eligibility, reason } = item
                        const canSelect = ['eligible', 'retake', 'elective'].includes(eligibility)
                        const isSelected = selected.includes(schedule._id)
                        const style = ELIGIBILITY_STYLES[eligibility]

                        return (
                          <tr
                            key={schedule._id}
                            onClick={() => canSelect && toggleSelect(schedule._id)}
                            className={`transition-colors ${canSelect ? 'cursor-pointer hover:bg-gray-50' : 'opacity-60'} ${isSelected ? 'bg-blue-50' : ''}`}
                          >
                            <td className="px-4 py-3">
                              {canSelect && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(schedule._id)}
                                  onClick={e => e.stopPropagation()}
                                  className="rounded border-gray-300"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800">{schedule.subjectId?.code}</p>
                              <p className="text-xs text-gray-400">{schedule.subjectId?.name}</p>
                              {schedule.subjectId?.hasLab && (
                                <span className="text-xs text-blue-600">+ Lab ₱{schedule.subjectId?.labFee}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{schedule.sectionId?.name}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{schedule.teacherId?.name}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              <p>{schedule.day}</p>
                              <p>{schedule.timeStart} — {schedule.timeEnd}</p>
                              <p className="text-gray-400">{schedule.room}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-center">
                              {schedule.subjectId?.units}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${style.badge}`}>
                                {style.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">{reason}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Sticky Submit Bar */}
                {selected.length > 0 && (
                  <div className="sticky bottom-4 bg-white border border-gray-200 rounded-lg shadow-lg px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {selected.length} subject(s) selected — {totalSelectedUnits} units
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Submit for registrar approval</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelected([])}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Enrollment'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── My Enrollments Tab ── */}
        {tab === 'my' && (
          <>
            {/* COR Download — shown when all enrollments are approved */}
            {allApproved && activeSemester && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-800">You are officially enrolled</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    All {myEnrollments.length} subject(s) approved for {activeSemester.schoolYear} — {activeSemester.term}
                  </p>
                </div>
                <a
                  href={`${import.meta.env.VITE_API_URL}/pdf/cor/${user?._id}/${activeSemester._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 font-medium"
                >
                  Download COR
                </a>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Subject', 'Section', 'Teacher', 'Schedule', 'Units', 'Status', 'Remarks'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myEnrollments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                        No enrollments found for this semester
                      </td>
                    </tr>
                  ) : myEnrollments.map(e => (
                    <tr key={e._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{e.scheduleId?.subjectId?.code}</p>
                        <p className="text-xs text-gray-400">{e.scheduleId?.subjectId?.name}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{e.scheduleId?.sectionId?.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{e.scheduleId?.teacherId?.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        <p>{e.scheduleId?.day}</p>
                        <p>{e.scheduleId?.timeStart} — {e.scheduleId?.timeEnd}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-center text-xs">
                        {e.scheduleId?.subjectId?.units}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[e.status]}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{e.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}