const TermGrade = require('../models/TermGrade')
const Semester = require('../models/Semester')
const { notify } = require('../utils/notify')

/**
 * Lock grades for a specific schedule + term
 * Registrar/superadmin only
 */
const lockGrades = async (req, res) => {
  try {
    const { scheduleId, term } = req.body

    if (!scheduleId || !term) {
      return res.status(400).json({
        status: 'error',
        message: 'scheduleId and term are required'
      })
    }

    const result = await TermGrade.updateMany(
      { scheduleId, term, isLocked: false },
      {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: req.user._id
      }
    )

    res.json({
      status: 'success',
      message: `Locked ${result.modifiedCount} grade(s) for ${term}`,
      data: { modifiedCount: result.modifiedCount }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Unlock grades for a specific schedule + term
 * Registrar/superadmin only
 */
const unlockGrades = async (req, res) => {
  try {
    const { scheduleId, term } = req.body

    if (!scheduleId || !term) {
      return res.status(400).json({
        status: 'error',
        message: 'scheduleId and term are required'
      })
    }

    const result = await TermGrade.updateMany(
      { scheduleId, term, isLocked: true },
      {
        isLocked: false,
        lockedAt: undefined,
        lockedBy: undefined
      }
    )

    res.json({
      status: 'success',
      message: `Unlocked ${result.modifiedCount} grade(s) for ${term}`,
      data: { modifiedCount: result.modifiedCount }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Lock ALL grades for an entire semester (bulk lock)
 * Superadmin only — used at end of semester
 */
const lockSemester = async (req, res) => {
  try {
    const { semesterId } = req.body

    if (!semesterId) {
      return res.status(400).json({
        status: 'error',
        message: 'semesterId is required'
      })
    }

    const result = await TermGrade.updateMany(
      { semesterId, isLocked: false },
      {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: req.user._id
      }
    )

    res.json({
      status: 'success',
      message: `Locked ${result.modifiedCount} grade(s) for the semester`,
      data: { modifiedCount: result.modifiedCount }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Unlock ALL grades for an entire semester
 * Superadmin only
 */
const unlockSemester = async (req, res) => {
  try {
    const { semesterId } = req.body

    if (!semesterId) {
      return res.status(400).json({
        status: 'error',
        message: 'semesterId is required'
      })
    }

    const result = await TermGrade.updateMany(
      { semesterId, isLocked: true },
      {
        isLocked: false,
        lockedAt: undefined,
        lockedBy: undefined
      }
    )

    res.json({
      status: 'success',
      message: `Unlocked ${result.modifiedCount} grade(s) for the semester`,
      data: { modifiedCount: result.modifiedCount }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

/**
 * Get lock status for a schedule
 */
const getLockStatus = async (req, res) => {
  try {
    const { scheduleId } = req.query

    if (!scheduleId) {
      return res.status(400).json({
        status: 'error',
        message: 'scheduleId is required'
      })
    }

    const terms = ['prelim', 'midterm', 'finals']
    const status = {}

    for (const term of terms) {
      const grades = await TermGrade.find({ scheduleId, term })
        .populate('lockedBy', 'name')
        .limit(1)

      if (grades.length === 0) {
        status[term] = { hasGrades: false, isLocked: false }
      } else {
        const locked = grades.filter(g => g.isLocked)
        status[term] = {
          hasGrades: true,
          isLocked: grades[0].isLocked,
          lockedAt: grades[0].lockedAt,
          lockedBy: grades[0].lockedBy?.name
        }
      }
    }

    res.json({ status: 'success', message: 'Lock status fetched', data: status })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  lockGrades,
  unlockGrades,
  lockSemester,
  unlockSemester,
  getLockStatus
}