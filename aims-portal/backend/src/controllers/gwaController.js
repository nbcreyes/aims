const TermGrade = require('../models/TermGrade')
const StudentRecord = require('../models/StudentRecord')
const Semester = require('../models/Semester')
const User = require('../models/User')

/**
 * Compute GWA for a student across all semesters or a specific one
 * GWA = average of all finals cumulative grades (published, passed or failed)
 */
const computeGWA = (grades) => {
  const finalsGrades = grades.filter(g =>
    g.term === 'finals' &&
    g.isPublished &&
    !g.isINC &&
    !g.incDefaulted &&
    g.cumulativeGrade > 0
  )

  if (finalsGrades.length === 0) return null

  const totalUnits = finalsGrades.reduce((sum, g) => {
    return sum + (g.scheduleId?.subjectId?.units || 0)
  }, 0)

  if (totalUnits === 0) return null

  const weightedSum = finalsGrades.reduce((sum, g) => {
    const units = g.scheduleId?.subjectId?.units || 0
    return sum + (g.cumulativeGrade * units)
  }, 0)

  return parseFloat((weightedSum / totalUnits).toFixed(4))
}

/**
 * Get GWA for a single student — registrar/superadmin/student (own)
 */
const getStudentGWA = async (req, res) => {
  try {
    const studentId = req.params.studentId

    // Students can only view their own
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    const grades = await TermGrade.find({ studentId })
      .populate({
        path: 'scheduleId',
        populate: { path: 'subjectId', select: 'name code units' }
      })
      .populate('semesterId', 'schoolYear term')

    // Group by semester
    const bySemester = {}
    for (const g of grades) {
      const key = g.semesterId?._id?.toString()
      if (!key) continue
      if (!bySemester[key]) {
        bySemester[key] = {
          semester: g.semesterId,
          grades: []
        }
      }
      bySemester[key].grades.push(g)
    }

    // Compute per-semester GWA
    const semesterGWAs = Object.values(bySemester).map(item => ({
      semester: item.semester,
      gwa: computeGWA(item.grades),
      subjectCount: item.grades.filter(g => g.term === 'finals' && g.isPublished).length
    }))

    // Overall GWA
    const overallGWA = computeGWA(grades)

    res.json({
      status: 'success',
      message: 'GWA computed',
      data: {
        overallGWA,
        semesterGWAs,
        totalSubjects: grades.filter(g => g.term === 'finals' && g.isPublished).length
      }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Get full transcript data for a student
 */
const getTranscript = async (req, res) => {
  try {
    const studentId = req.params.studentId

    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    const student = await User.findById(studentId).select('-password')
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' })
    }

    const record = await StudentRecord.findOne({ studentId })
      .populate('programId', 'name code')

    const grades = await TermGrade.find({ studentId })
      .populate({
        path: 'scheduleId',
        populate: { path: 'subjectId', select: 'name code units' }
      })
      .populate('semesterId', 'schoolYear term isActive')
      .sort({ 'semesterId.schoolYear': 1 })

    // Group by semester then by schedule
    const semesterMap = {}
    for (const g of grades) {
      const semKey = g.semesterId?._id?.toString()
      if (!semKey) continue

      if (!semesterMap[semKey]) {
        semesterMap[semKey] = {
          semester: g.semesterId,
          subjects: {}
        }
      }

      const schedKey = g.scheduleId?._id?.toString()
      if (!schedKey) continue

      if (!semesterMap[semKey].subjects[schedKey]) {
        semesterMap[semKey].subjects[schedKey] = {
          schedule: g.scheduleId,
          subject: g.scheduleId?.subjectId,
          terms: {}
        }
      }

      semesterMap[semKey].subjects[schedKey].terms[g.term] = g
    }

    // Build semester summaries
    const semesters = Object.values(semesterMap).map(item => {
      const subjects = Object.values(item.subjects)
      const allGrades = grades.filter(g =>
        g.semesterId?._id?.toString() === item.semester._id?.toString()
      )
      return {
        semester: item.semester,
        subjects,
        semesterGWA: computeGWA(allGrades),
        totalUnits: subjects.reduce((sum, s) => {
          const finals = s.terms['finals']
          if (finals?.isPublished && finals?.cumulativeGrade >= 75) {
            return sum + (s.subject?.units || 0)
          }
          return sum
        }, 0)
      }
    })

    const overallGWA = computeGWA(grades)
    const totalUnitsEarned = semesters.reduce((sum, s) => sum + s.totalUnits, 0)

    res.json({
      status: 'success',
      message: 'Transcript fetched',
      data: {
        student,
        record,
        semesters,
        overallGWA,
        totalUnitsEarned
      }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = { getStudentGWA, getTranscript, computeGWA }