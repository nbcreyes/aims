const TermGrade = require('../models/TermGrade')
const { notify } = require('../utils/notify')

/**
 * Mark a student as eligible for removal exam
 * Only registrar/superadmin
 */
const markEligibleForRemoval = async (req, res) => {
  try {
    const { studentId, scheduleId } = req.body

    if (!studentId || !scheduleId) {
      return res.status(400).json({
        status: 'error',
        message: 'studentId and scheduleId are required'
      })
    }

    const grade = await TermGrade.findOne({ studentId, scheduleId, term: 'finals' })
    if (!grade) {
      return res.status(404).json({
        status: 'error',
        message: 'Finals grade not found'
      })
    }

    if (grade.cumulativeGrade >= 75) {
      return res.status(400).json({
        status: 'error',
        message: 'Student already passed this subject. Removal exam is only for failed subjects.'
      })
    }

    if (grade.isINC || grade.incDefaulted) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot mark removal exam for an INC grade. Resolve INC first.'
      })
    }

    grade.isEligibleForRemoval = true
    grade.updatedAt = new Date()
    await grade.save()

    await notify(
      studentId,
      'Removal Exam Eligibility',
      'You have been marked eligible for a removal exam. Please coordinate with your teacher for the schedule.'
    )

    res.json({
      status: 'success',
      message: 'Student marked eligible for removal exam',
      data: grade
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Record removal exam result
 * Teacher or registrar
 */
const recordRemovalExam = async (req, res) => {
  try {
    const { studentId, scheduleId, examScore, examTotal } = req.body

    if (!studentId || !scheduleId || examScore === undefined || !examTotal) {
      return res.status(400).json({
        status: 'error',
        message: 'studentId, scheduleId, examScore, and examTotal are required'
      })
    }

    if (examScore < 0 || examScore > examTotal) {
      return res.status(400).json({
        status: 'error',
        message: 'examScore must be between 0 and examTotal'
      })
    }

    const grade = await TermGrade.findOne({ studentId, scheduleId, term: 'finals' })
    if (!grade) {
      return res.status(404).json({
        status: 'error',
        message: 'Finals grade not found'
      })
    }

    if (!grade.isEligibleForRemoval) {
      return res.status(400).json({
        status: 'error',
        message: 'Student is not marked eligible for a removal exam'
      })
    }

    if (grade.removalPassed !== undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Removal exam has already been recorded for this student'
      })
    }

    const examPercent = (examScore / examTotal) * 100
    const passed = examPercent >= 75

    // If passed, update the cumulative grade to 75 (minimum passing)
    if (passed) {
      grade.cumulativeGrade = 75
      grade.termGrade = 75
      grade.isPublished = true
    }

    grade.removalExamScore = examScore
    grade.removalExamTotal = examTotal
    grade.removalExamDate = new Date()
    grade.removalExamGrade = parseFloat(examPercent.toFixed(2))
    grade.removalPassed = passed
    grade.removalAdministeredBy = req.user._id
    grade.isEligibleForRemoval = false
    grade.updatedAt = new Date()

    await grade.save()

    await notify(
      studentId,
      'Removal Exam Result',
      passed
        ? `You passed the removal exam with ${examPercent.toFixed(2)}%. Your grade has been updated to 75 (passing).`
        : `You did not pass the removal exam (${examPercent.toFixed(2)}%). You will need to retake the subject next semester.`
    )

    res.json({
      status: 'success',
      message: passed ? 'Removal exam passed — grade updated to 75' : 'Removal exam failed',
      data: grade
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Get all removal exam eligibles / results — registrar view
 */
const getRemovalList = async (req, res) => {
  try {
    const filter = {}

    if (req.query.eligibleOnly === 'true') {
      filter.isEligibleForRemoval = true
    } else {
      // Show all that have been through removal process
      filter.$or = [
        { isEligibleForRemoval: true },
        { removalExamScore: { $exists: true } }
      ]
    }

    if (req.query.semesterId) filter.semesterId = req.query.semesterId
    if (req.query.studentId) filter.studentId = req.query.studentId

    const grades = await TermGrade.find(filter)
      .populate('studentId', 'name email')
      .populate({
        path: 'scheduleId',
        populate: { path: 'subjectId', select: 'name code units' }
      })
      .populate('semesterId', 'schoolYear term')
      .populate('removalAdministeredBy', 'name')
      .sort({ createdAt: -1 })

    res.json({
      status: 'success',
      message: 'Removal exam list fetched',
      data: grades
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Get student's own removal exam status
 */
const getMyRemovalStatus = async (req, res) => {
  try {
    const grades = await TermGrade.find({
      studentId: req.user._id,
      $or: [
        { isEligibleForRemoval: true },
        { removalExamScore: { $exists: true } }
      ]
    })
      .populate({
        path: 'scheduleId',
        populate: { path: 'subjectId', select: 'name code units' }
      })
      .populate('semesterId', 'schoolYear term')

    res.json({
      status: 'success',
      message: 'Removal exam status fetched',
      data: grades
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  markEligibleForRemoval,
  recordRemovalExam,
  getRemovalList,
  getMyRemovalStatus
}