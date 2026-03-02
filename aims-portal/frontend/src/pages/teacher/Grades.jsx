import { useState, useEffect } from 'react'
import api from '../../utils/api'
import DashboardLayout from '../../components/shared/DashboardLayout'

const TERMS = ['prelim', 'midterm', 'finals']

export default function TeacherGrades() {
  const [schedules, setSchedules] = useState([])
  const [semesters, setSemesters] = useState([])
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [selectedTerm, setSelectedTerm] = useState('prelim')
  const [sheet, setSheet] = useState([])
  const [editing, setEditing] = useState(null)
  const [editData, setEditData] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const semRes = await api.get('/semesters')
        setSemesters(semRes.data.data)
        const active = semRes.data.data.find(s => s.isActive)
        if (active) setSelectedSemester(active._id)
      } catch { }
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedSemester) return
    const fetch = async () => {
      try {
        const res = await api.get(`/schedules/my?semesterId=${selectedSemester}`)
        setSchedules(res.data.data)
      } catch { }
    }
    fetch()
  }, [selectedSemester])

  const fetchSheet = async (scheduleId, term) => {
    setError('')
    setSuccess('')
    try {
      const res = await api.get(`/grades/sheet?scheduleId=${scheduleId}&term=${term}`)
      setSheet(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load gradesheet')
    }
  }

  const handleSelectSchedule = (s) => {
    setSelectedSchedule(s)
    setEditing(null)
    setSheet([])
    fetchSheet(s._id, selectedTerm)
  }

  const handleTermChange = (term) => {
    setSelectedTerm(term)
    setEditing(null)
    if (selectedSchedule) fetchSheet(selectedSchedule._id, term)
  }

  const handleEdit = (row) => {
    setEditing(row.student._id)
    setEditData({
      quizScores: row.grade.quizScores || [],
      activityScores: row.grade.activityScores || [],
      examScore: row.grade.examScore || 0,
      examMaxScore: row.grade.examMaxScore || 0
    })
    setError('')
    setSuccess('')
  }

  const handleSave = async (studentId) => {
    setLoading(true)
    setError('')
    try {
      await api.put('/grades', {
        studentId,
        scheduleId: selectedSchedule._id,
        semesterId: selectedSemester,
        term: selectedTerm,
        ...editData
      })
      setSuccess('Grade saved')
      setEditing(null)
      fetchSheet(selectedSchedule._id, selectedTerm)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save grade')
    } finally {
      setLoading(false)
    }
  }

  const handleAddScore = (type) => {
    setEditData(prev => ({
      ...prev,
      [type]: [...prev[type], { title: '', score: 0, maxScore: 0 }]
    }))
  }

  const handleScoreChange = (type, index, field, value) => {
    setEditData(prev => {
      const updated = [...prev[type]]
      updated[index] = { ...updated[index], [field]: field === 'title' ? value : Number(value) }
      return { ...prev, [type]: updated }
    })
  }

  const handleRemoveScore = (type, index) => {
    setEditData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const handlePublish = async () => {
    if (!confirm(`Publish ${selectedTerm} grades? Students will be able to see them.`)) return
    setLoading(true)
    try {
      await api.post('/grades/publish', {
        scheduleId: selectedSchedule._id,
        term: selectedTerm
      })
      setSuccess(`${selectedTerm} grades published`)
      fetchSheet(selectedSchedule._id, selectedTerm)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish grades')
    } finally {
      setLoading(false)
    }
  }

  const handleUnpublish = async () => {
    setLoading(true)
    try {
      await api.post('/grades/unpublish', {
        scheduleId: selectedSchedule._id,
        term: selectedTerm
      })
      setSuccess(`${selectedTerm} grades unpublished`)
      fetchSheet(selectedSchedule._id, selectedTerm)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unpublish grades')
    } finally {
      setLoading(false)
    }
  }

  const allPublished = sheet.length > 0 && sheet.every(r => r.grade.isPublished)

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Grades</h1>

        {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4 border border-red-200">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded mb-4 border border-green-200">{success}</div>}

        <div className="flex gap-6">
          {/* Left — Class List */}
          <div className="w-64 flex-shrink-0">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select semester</option>
              {semesters.map(s => (
                <option key={s._id} value={s._id}>{s.schoolYear} — {s.term}</option>
              ))}
            </select>

            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">My Classes</p>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {schedules.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-6 text-center">No classes found</p>
              ) : schedules.map(s => (
                <button
                  key={s._id}
                  onClick={() => handleSelectSchedule(s)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedSchedule?._id === s._id ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm font-medium text-gray-800">{s.subjectId?.name}</p>
                  <p className="text-xs text-gray-400">{s.sectionId?.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right — Gradesheet */}
          <div className="flex-1">
            {!selectedSchedule ? (
              <div className="bg-white border border-gray-200 rounded-lg flex items-center justify-center h-48">
                <p className="text-sm text-gray-400">Select a class to manage grades</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-base font-semibold text-gray-800">{selectedSchedule.subjectId?.name}</p>
                    <p className="text-xs text-gray-400">{selectedSchedule.sectionId?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    {allPublished ? (
                      <button
                        onClick={handleUnpublish}
                        disabled={loading}
                        className="bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-gray-700 disabled:opacity-50"
                      >
                        Unpublish Grades
                      </button>
                    ) : (
                      <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-green-700 disabled:opacity-50"
                      >
                        Publish Grades
                      </button>
                    )}
                  </div>
                </div>

                {/* Term Tabs */}
                <div className="flex border-b border-gray-200 mb-4">
                  {TERMS.map(term => (
                    <button
                      key={term}
                      onClick={() => handleTermChange(term)}
                      className={`px-5 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${selectedTerm === term ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                      {term}
                    </button>
                  ))}
                </div>

                {/* Gradesheet Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Student', 'Quizzes', 'Activities', 'Exam', 'Class Standing', 'Grade', 'Published', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sheet.length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400 text-sm">No students enrolled</td></tr>
                      ) : sheet.map(row => (
                        <>
                          <tr key={row.student._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800">{row.student.name}</p>
                              <p className="text-xs text-gray-400">{row.student.email}</p>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{row.grade.quizScores?.length || 0}</td>
                            <td className="px-4 py-3 text-gray-600">{row.grade.activityScores?.length || 0}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {row.grade.examScore || 0} / {row.grade.examMaxScore || 0}
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-medium">{row.grade.classStanding?.toFixed(2) || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${row.grade.cumulativeGrade >= 75 ? 'text-green-600' : row.grade.cumulativeGrade > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {row.grade.cumulativeGrade?.toFixed(2) || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {row.grade.isPublished
                                ? <span className="text-xs text-green-600 font-medium">Yes</span>
                                : <span className="text-xs text-gray-400">No</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleEdit(row)}
                                className="text-blue-600 hover:underline text-xs"
                              >
                                {editing === row.student._id ? 'Cancel' : 'Edit'}
                              </button>
                            </td>
                          </tr>

                          {/* Inline Edit Row */}
                          {editing === row.student._id && (
                            <tr key={`edit-${row.student._id}`} className="bg-blue-50">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="space-y-4">

                                  {/* Quizzes */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-semibold text-gray-600">Quiz Scores</p>
                                      <button onClick={() => handleAddScore('quizScores')} className="text-xs text-blue-600 hover:underline">+ Add Quiz</button>
                                    </div>
                                    {editData.quizScores.map((q, i) => (
                                      <div key={i} className="flex items-center gap-2 mb-1">
                                        <input type="text" placeholder="Title" value={q.title}
                                          onChange={(e) => handleScoreChange('quizScores', i, 'title', e.target.value)}
                                          className="border border-gray-300 rounded px-2 py-1 text-xs w-32" />
                                        <input type="number" placeholder="Score" value={q.score}
                                          onChange={(e) => handleScoreChange('quizScores', i, 'score', e.target.value)}
                                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20" />
                                        <span className="text-xs text-gray-400">/</span>
                                        <input type="number" placeholder="Max" value={q.maxScore}
                                          onChange={(e) => handleScoreChange('quizScores', i, 'maxScore', e.target.value)}
                                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20" />
                                        <button onClick={() => handleRemoveScore('quizScores', i)} className="text-red-500 text-xs hover:underline">Remove</button>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Activities */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-semibold text-gray-600">Activity Scores</p>
                                      <button onClick={() => handleAddScore('activityScores')} className="text-xs text-blue-600 hover:underline">+ Add Activity</button>
                                    </div>
                                    {editData.activityScores.map((a, i) => (
                                      <div key={i} className="flex items-center gap-2 mb-1">
                                        <input type="text" placeholder="Title" value={a.title}
                                          onChange={(e) => handleScoreChange('activityScores', i, 'title', e.target.value)}
                                          className="border border-gray-300 rounded px-2 py-1 text-xs w-32" />
                                        <input type="number" placeholder="Score" value={a.score}
                                          onChange={(e) => handleScoreChange('activityScores', i, 'score', e.target.value)}
                                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20" />
                                        <span className="text-xs text-gray-400">/</span>
                                        <input type="number" placeholder="Max" value={a.maxScore}
                                          onChange={(e) => handleScoreChange('activityScores', i, 'maxScore', e.target.value)}
                                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20" />
                                        <button onClick={() => handleRemoveScore('activityScores', i)} className="text-red-500 text-xs hover:underline">Remove</button>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Exam */}
                                  <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                      {selectedTerm.charAt(0).toUpperCase() + selectedTerm.slice(1)} Exam
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <input type="number" placeholder="Score" value={editData.examScore}
                                        onChange={(e) => setEditData(prev => ({ ...prev, examScore: Number(e.target.value) }))}
                                        className="border border-gray-300 rounded px-2 py-1 text-xs w-24" />
                                      <span className="text-xs text-gray-400">/</span>
                                      <input type="number" placeholder="Max" value={editData.examMaxScore}
                                        onChange={(e) => setEditData(prev => ({ ...prev, examMaxScore: Number(e.target.value) }))}
                                        className="border border-gray-300 rounded px-2 py-1 text-xs w-24" />
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleSave(row.student._id)}
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {loading ? 'Saving...' : 'Save Grade'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}