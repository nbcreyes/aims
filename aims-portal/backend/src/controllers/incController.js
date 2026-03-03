const TermGrade = require('../models/TermGrade')
const { notify } = require('../utils/notify')

const markINC = async (req, res) => {
  try {
    const { studentId, scheduleId, reason, deadlineDays } = req.body

    if (!studentId || !scheduleId) {
      return res.status(400).json({
        status: 'error',
        message: 'studentId and scheduleId are required'
      })
    }

    // INC only applies to finals
    const grade = await TermGrade.findOne({ studentId, scheduleId, term: 'finals' })
    if (!grade) {
      return res.status(404).json({
        status: 'error',
        message: 'Finals grade not found. Student must have a finals grade entry to mark as INC.'
      })
    }

    if (grade.isLocked && !['superadmin', 'registrar'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Grade is locked. Contact registrar to override.'
      })
    }

    // Set INC deadline — default 1 semester (approx 6 months = 180 days)
    const days = deadlineDays || 180
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + days)

    grade.isINC = true
    grade.incReason = reason || 'Incomplete requirements'
    grade.incDeadline = deadline
    grade.incResolvedAt = undefined
    grade.incResolvedGrade = undefined
    grade.incDefaulted = false
    grade.updatedAt = new Date()

    await grade.save()

    // Notify student
    await notify(
      studentId,
      'INC Grade Recorded',
      `You have been given an INC grade. Reason: ${grade.incReason}. Deadline to complete: ${deadline.toLocaleDateString()}.`
    )

    res.json({
      status: 'success',
      message: 'INC grade recorded',
      data: grade
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Resolve an INC grade — teacher/registrar submits the completion grade
 */
const resolveINC = async (req, res) => {
  try {
    const { studentId, scheduleId, resolvedGrade } = req.body

    if (!studentId || !scheduleId || resolvedGrade === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'studentId, scheduleId, and resolvedGrade are required'
      })
    }

    if (resolvedGrade < 0 || resolvedGrade > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'resolvedGrade must be between 0 and 100'
      })
    }

    const grade = await TermGrade.findOne({ studentId, scheduleId, term: 'finals' })
    if (!grade) {
      return res.status(404).json({ status: 'error', message: 'Finals grade not found' })
    }

    if (!grade.isINC) {
      return res.status(400).json({ status: 'error', message: 'This grade is not marked as INC' })
    }

    if (grade.incDefaulted) {
      return res.status(400).json({
        status: 'error',
        message: 'INC has already defaulted to 5.0. Contact registrar to override.'
      })
    }

    // Check deadline
    if (grade.incDeadline && new Date() > new Date(grade.incDeadline)) {
      return res.status(400).json({
        status: 'error',
        message: `INC deadline has passed (${new Date(grade.incDeadline).toLocaleDateString()}). Grade has defaulted to 5.0.`
      })
    }

    grade.isINC = false
    grade.incResolvedAt = new Date()
    grade.incResolvedGrade = resolvedGrade
    grade.cumulativeGrade = resolvedGrade
    grade.termGrade = resolvedGrade
    grade.isPublished = true
    grade.updatedAt = new Date()

    await grade.save()

    await notify(
      studentId,
      'INC Grade Resolved',
      `Your INC grade has been resolved. Final grade: ${resolvedGrade}%.`
    )

    res.json({
      status: 'success',
      message: 'INC resolved',
      data: grade
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Default all overdue INC grades to 5.0
 * Run this on a schedule (e.g. daily via cron or server startup)
 */
const defaultOverdueINC = async () => {
  try {
    const overdue = await TermGrade.find({
      isINC: true,
      incDefaulted: false,
      incDeadline: { $lt: new Date() }
    })

    for (const grade of overdue) {
      grade.isINC = false
      grade.incDefaulted = true
      grade.cumulativeGrade = 0   // 0% = failed = 5.0 in PH grading
      grade.termGrade = 0
      grade.isPublished = true
      grade.updatedAt = new Date()
      await grade.save()

      await notify(
        grade.studentId,
        'INC Grade Defaulted',
        'Your INC grade has expired and has been defaulted to a failing grade (5.0). Please contact the registrar.'
      )
    }

    if (overdue.length > 0) {
      console.log(`[INC] Defaulted ${overdue.length} overdue INC grade(s)`)
    }
  } catch (error) {
    console.error('[INC] Auto-default error:', error.message)
  }
}

/**
 * Get all INC grades — registrar view
 */
const getINCGrades = async (req, res) => {
  try {
    const filter = { isINC: true }
    if (req.query.studentId) filter.studentId = req.query.studentId
    if (req.query.semesterId) filter.semesterId = req.query.semesterId
    if (req.query.includeDefaulted === 'true') delete filter.isINC // show all INC-related

    const grades = await TermGrade.find(
      req.query.includeDefaulted === 'true'
        ? { $or: [{ isINC: true }, { incDefaulted: true }], ...( req.query.studentId ? { studentId: req.query.studentId } : {}) }
        : filter
    )
      .populate('studentId', 'name email')
      .populate({
        path: 'scheduleId',
        populate: { path: 'subjectId', select: 'name code units' }
      })
      .populate('semesterId', 'schoolYear term')
      .sort({ incDeadline: 1 })

    res.json({ status: 'success', message: 'INC grades fetched', data: grades })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Get student's own INC grades
 */
const getMyINCGrades = async (req, res) => {
  try {
    const grades = await TermGrade.find({
      studentId: req.user._id,
      $or: [{ isINC: true }, { incDefaulted: true }]
    })
      .populate({
        path: 'scheduleId',
        populate: { path: 'subjectId', select: 'name code units' }
      })
      .populate('semesterId', 'schoolYear term')
      .sort({ incDeadline: 1 })

    res.json({ status: 'success', message: 'INC grades fetched', data: grades })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = { markINC, resolveINC, defaultOverdueINC, getINCGrades, getMyINCGrades }