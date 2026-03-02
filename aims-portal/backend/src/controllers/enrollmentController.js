const Enrollment = require('../models/Enrollment')
const StudentFee = require('../models/StudentFee')
const StudentRecord = require('../models/StudentRecord')
const ClassSchedule = require('../models/ClassSchedule')
const Program = require('../models/Program')
const Subject = require('../models/Subject')
const { computeStudentFees } = require('../utils/fees')

const getEnrollments = async (req, res) => {
  try {
    const filter = {}
    if (req.query.semesterId) filter.semesterId = req.query.semesterId
    if (req.query.status) filter.status = req.query.status
    if (req.query.studentId) filter.studentId = req.query.studentId
    if (req.query.programId) filter.programId = req.query.programId

    const enrollments = await Enrollment.find(filter)
      .populate('studentId', 'name email')
      .populate('semesterId', 'schoolYear term')
      .populate('programId', 'name code')
      .populate({
        path: 'subjects',
        populate: { path: 'subjectId', select: 'name code units hasLab labFee' }
      })
      .sort({ enrolledAt: -1 })

    res.json({ status: 'success', message: 'Enrollments fetched', data: enrollments })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('semesterId', 'schoolYear term')
      .populate('programId', 'name code')
      .populate({
        path: 'subjects',
        populate: { path: 'subjectId', select: 'name code units hasLab labFee' }
      })

    if (!enrollment) {
      return res.status(404).json({ status: 'error', message: 'Enrollment not found' })
    }

    res.json({ status: 'success', message: 'Enrollment fetched', data: enrollment })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const submitEnrollment = async (req, res) => {
  try {
    const { semesterId, subjects } = req.body
    const studentId = req.user._id

    if (!semesterId || !subjects || subjects.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Semester and subjects are required' })
    }

    // Get student record for programId and yearLevel
    const studentRecord = await StudentRecord.findOne({ studentId })
    if (!studentRecord) {
      return res.status(404).json({ status: 'error', message: 'Student record not found' })
    }

    // Prevent duplicate enrollment for same semester
    const existing = await Enrollment.findOne({ studentId, semesterId })
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Already enrolled for this semester' })
    }

    const enrollment = await Enrollment.create({
      studentId,
      semesterId,
      programId: studentRecord.programId,
      yearLevel: studentRecord.yearLevel,
      subjects,
      status: 'pending'
    })

    res.status(201).json({ status: 'success', message: 'Enrollment submitted for approval', data: enrollment })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateEnrollmentStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'approved', 'rejected', 'dropped']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status' })
    }

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('programId')
      .populate({
        path: 'subjects',
        populate: { path: 'subjectId' }
      })

    if (!enrollment) {
      return res.status(404).json({ status: 'error', message: 'Enrollment not found' })
    }

    if (enrollment.status === 'approved' && status !== 'dropped') {
      return res.status(400).json({ status: 'error', message: 'Enrollment is already approved' })
    }

    enrollment.status = status
    await enrollment.save()

    // Auto-compute and create StudentFee on approval
    if (status === 'approved') {
      const existingFee = await StudentFee.findOne({ enrollmentId: enrollment._id })
      if (!existingFee) {
        const enrolledSubjects = enrollment.subjects.map(s => s.subjectId).filter(Boolean)
        const feeData = computeStudentFees(enrollment.programId, enrolledSubjects)

        await StudentFee.create({
          studentId: enrollment.studentId,
          enrollmentId: enrollment._id,
          semesterId: enrollment.semesterId,
          tuitionFee: feeData.tuitionFee,
          labFees: feeData.labFees,
          miscFee: feeData.miscFee,
          totalAmount: feeData.totalAmount,
          balance: feeData.totalAmount,
          breakdown: feeData.breakdown,
          status: 'unpaid'
        })
      }
    }

    res.json({ status: 'success', message: `Enrollment ${status}`, data: enrollment })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getMyEnrollment = async (req, res) => {
  try {
    const { semesterId } = req.query
    const filter = { studentId: req.user._id }
    if (semesterId) filter.semesterId = semesterId

    const enrollment = await Enrollment.findOne(filter)
      .populate('semesterId', 'schoolYear term')
      .populate('programId', 'name code')
      .populate({
        path: 'subjects',
        populate: [
          { path: 'subjectId', select: 'name code units' },
          { path: 'teacherId', select: 'name' }
        ]
      })
      .sort({ enrolledAt: -1 })

    res.json({ status: 'success', message: 'Enrollment fetched', data: enrollment })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getAvailableSubjects = async (req, res) => {
  try {
    const studentRecord = await StudentRecord.findOne({ studentId: req.user._id })
    if (!studentRecord) {
      return res.status(404).json({ status: 'error', message: 'Student record not found' })
    }

    const { semesterId } = req.query
    if (!semesterId) {
      return res.status(400).json({ status: 'error', message: 'semesterId is required' })
    }

    const schedules = await ClassSchedule.find({
      semesterId,
    })
      .populate({
        path: 'sectionId',
        match: {
          programId: studentRecord.programId,
          yearLevel: studentRecord.yearLevel
        }
      })
      .populate('subjectId', 'name code units hasLab labFee')
      .populate('teacherId', 'name')

    const filtered = schedules.filter(s => s.sectionId !== null)

    res.json({ status: 'success', message: 'Available subjects fetched', data: filtered })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  getEnrollments,
  getEnrollment,
  submitEnrollment,
  updateEnrollmentStatus,
  getMyEnrollment,
  getAvailableSubjects
}