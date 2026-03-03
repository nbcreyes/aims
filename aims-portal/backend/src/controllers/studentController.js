const User = require('../models/User')
const UserProfile = require('../models/UserProfile')
const StudentRecord = require('../models/StudentRecord')
const Enrollment = require('../models/Enrollment')
const TermGrade = require('../models/TermGrade')

const getStudents = async (req, res) => {
  try {
    const filter = { role: 'student' }
    if (req.query.status) filter.status = req.query.status

    const users = await User.find(filter).select('-password').sort({ name: 1 })

    const students = await Promise.all(users.map(async (user) => {
      const record = await StudentRecord.findOne({ studentId: user._id })
        .populate('programId', 'name code department')
      const profile = await UserProfile.findOne({ userId: user._id })
      return { user, record, profile }
    }))

    res.json({ status: 'success', message: 'Students fetched', data: students })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getStudent = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user || user.role !== 'student') {
      return res.status(404).json({ status: 'error', message: 'Student not found' })
    }

    const record = await StudentRecord.findOne({ studentId: user._id })
      .populate('programId', 'name code department years')
    const profile = await UserProfile.findOne({ userId: user._id })

    const enrollments = await Enrollment.find({ studentId: user._id })
      .populate('semesterId', 'schoolYear term')
      .sort({ enrolledAt: -1 })

    res.json({
      status: 'success',
      message: 'Student fetched',
      data: { user, record, profile, enrollments }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateStudentRecord = async (req, res) => {
  try {
    const { yearLevel, programId, status } = req.body

    const user = await User.findById(req.params.id)
    if (!user || user.role !== 'student') {
      return res.status(404).json({ status: 'error', message: 'Student not found' })
    }

    const record = await StudentRecord.findOne({ studentId: req.params.id })
    if (!record) {
      return res.status(404).json({ status: 'error', message: 'Student record not found' })
    }

    if (yearLevel) record.yearLevel = yearLevel
    if (programId) record.programId = programId
    await record.save()

    if (status) {
      await User.findByIdAndUpdate(req.params.id, { status })
    }

    const updated = await StudentRecord.findOne({ studentId: req.params.id })
      .populate('programId', 'name code department')

    res.json({ status: 'success', message: 'Student record updated', data: updated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateStudentProfile = async (req, res) => {
  try {
    const { phone, address, birthdate, photo } = req.body

    const user = await User.findById(req.params.id)
    if (!user || user.role !== 'student') {
      return res.status(404).json({ status: 'error', message: 'Student not found' })
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.params.id },
      { phone, address, birthdate, photo },
      { new: true, upsert: true }
    )

    res.json({ status: 'success', message: 'Profile updated', data: profile })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getMyRecord = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    const record = await StudentRecord.findOne({ studentId: req.user._id })
      .populate('programId', 'name code department years')
    const profile = await UserProfile.findOne({ userId: req.user._id })

    const enrollments = await Enrollment.find({ studentId: req.user._id })
      .populate('semesterId', 'schoolYear term')
      .sort({ enrolledAt: -1 })

    res.json({
      status: 'success',
      message: 'My record fetched',
      data: { user, record, profile, enrollments }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

// ─── GWA ─────────────────────────────────────────────────────────────────────

const computeGWAForStudent = async (studentId) => {
  const enrollments = await Enrollment.find({
    studentId,
    status: 'approved'
  }).populate({
    path: 'scheduleId',
    populate: { path: 'subjectId', select: 'units code name' }
  })

  if (!enrollments.length) return null

  let totalWeightedGrade = 0
  let totalUnits = 0
  const breakdown = []

  for (const enrollment of enrollments) {
    const schedule = enrollment.scheduleId
    if (!schedule?.subjectId) continue

    const units = schedule.subjectId.units || 0
    if (units === 0) continue

    // Best available published grade: finals > midterm > prelim
    const grade =
      await TermGrade.findOne({ studentId, scheduleId: schedule._id, term: 'finals', isPublished: true }) ||
      await TermGrade.findOne({ studentId, scheduleId: schedule._id, term: 'midterm', isPublished: true }) ||
      await TermGrade.findOne({ studentId, scheduleId: schedule._id, term: 'prelim', isPublished: true })

    if (!grade) continue

    const gradeValue = grade.cumulativeGrade || 0
    totalWeightedGrade += gradeValue * units
    totalUnits += units

    breakdown.push({
      subject: schedule.subjectId.code,
      name: schedule.subjectId.name,
      units,
      grade: gradeValue,
      term: grade.term,
      passed: gradeValue >= 75
    })
  }

  if (totalUnits === 0) return null

  const gwa = parseFloat((totalWeightedGrade / totalUnits).toFixed(2))

  // Persist to StudentRecord
  await StudentRecord.findOneAndUpdate(
    { studentId },
    { gwa, gwaUpdatedAt: new Date() }
  )

  return { gwa, totalUnits, breakdown }
}

const getStudentGWA = async (req, res) => {
  try {
    const { id } = req.params

    if (req.user.role === 'student' && req.user._id.toString() !== id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    const result = await computeGWAForStudent(id)

    res.json({
      status: 'success',
      message: result ? 'GWA computed' : 'No grades available',
      data: result || { gwa: null, totalUnits: 0, breakdown: [] }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getSemesterGWA = async (req, res) => {
  try {
    const { id } = req.params
    const { semesterId } = req.query

    if (!semesterId) {
      return res.status(400).json({ status: 'error', message: 'semesterId is required' })
    }

    if (req.user.role === 'student' && req.user._id.toString() !== id) {
      return res.status(403).json({ status: 'error', message: 'Access denied' })
    }

    const enrollments = await Enrollment.find({
      studentId: id,
      semesterId,
      status: 'approved'
    }).populate({
      path: 'scheduleId',
      populate: { path: 'subjectId', select: 'units code name' }
    })

    if (!enrollments.length) {
      return res.json({
        status: 'success',
        message: 'No grades available for this semester',
        data: { gwa: null, totalUnits: 0, breakdown: [] }
      })
    }

    let totalWeightedGrade = 0
    let totalUnits = 0
    const breakdown = []

    for (const enrollment of enrollments) {
      const schedule = enrollment.scheduleId
      if (!schedule?.subjectId) continue

      const units = schedule.subjectId.units || 0
      if (units === 0) continue

      const grade =
        await TermGrade.findOne({ studentId: id, scheduleId: schedule._id, term: 'finals', isPublished: true }) ||
        await TermGrade.findOne({ studentId: id, scheduleId: schedule._id, term: 'midterm', isPublished: true }) ||
        await TermGrade.findOne({ studentId: id, scheduleId: schedule._id, term: 'prelim', isPublished: true })

      if (!grade) continue

      const gradeValue = grade.cumulativeGrade || 0
      totalWeightedGrade += gradeValue * units
      totalUnits += units

      breakdown.push({
        subject: schedule.subjectId.code,
        name: schedule.subjectId.name,
        units,
        grade: gradeValue,
        term: grade.term,
        passed: gradeValue >= 75
      })
    }

    if (totalUnits === 0) {
      return res.json({
        status: 'success',
        message: 'No published grades for this semester',
        data: { gwa: null, totalUnits: 0, breakdown: [] }
      })
    }

    const gwa = parseFloat((totalWeightedGrade / totalUnits).toFixed(2))

    res.json({
      status: 'success',
      message: 'Semester GWA computed',
      data: { gwa, totalUnits, breakdown }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const recalculateGWA = async (req, res) => {
  try {
    const { id } = req.params
    const result = await computeGWAForStudent(id)

    res.json({
      status: 'success',
      message: 'GWA recalculated',
      data: result || { gwa: null, totalUnits: 0, breakdown: [] }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  getStudents,
  getStudent,
  updateStudentRecord,
  updateStudentProfile,
  getMyRecord,
  getStudentGWA,
  getSemesterGWA,
  recalculateGWA,
  computeGWAForStudent
}