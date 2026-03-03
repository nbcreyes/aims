const Semester = require('../models/Semester')
const TermGrade = require('../models/TermGrade')

const TERM_WEEK = {
  prelim: 6,
  midterm: 12,
  finals: 18
}

const GRACE_WEEKS = 1
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Check if a term is past its lock date for a given semester
 */
const isTermLocked = (semester, term) => {
  if (!semester?.startDate) return false

  const start = new Date(semester.startDate)
  const lockDate = new Date(
    start.getTime() + (TERM_WEEK[term] + GRACE_WEEKS) * WEEK_MS
  )

  return new Date() > lockDate
}

/**
 * Auto-lock all unlocked grades whose lock date has passed
 * Call this on a schedule or before grade operations
 */
const autoLockGrades = async () => {
  try {
    const semesters = await Semester.find({ isActive: true })

    for (const semester of semesters) {
      for (const term of ['prelim', 'midterm', 'finals']) {
        if (isTermLocked(semester, term)) {
          await TermGrade.updateMany(
            {
              semesterId: semester._id,
              term,
              isLocked: false
            },
            { isLocked: true }
          )
        }
      }
    }
  } catch (error) {
    console.error('Auto-lock error:', error.message)
  }
}

/**
 * Get lock status and lock date for each term in a semester
 */
const getLockStatus = (semester) => {
  if (!semester?.startDate) return {}

  const start = new Date(semester.startDate)
  const status = {}

  for (const term of ['prelim', 'midterm', 'finals']) {
    const lockDate = new Date(
      start.getTime() + (TERM_WEEK[term] + GRACE_WEEKS) * WEEK_MS
    )
    status[term] = {
      lockDate,
      isLocked: new Date() > lockDate,
      daysUntilLock: Math.ceil((lockDate - new Date()) / (24 * 60 * 60 * 1000))
    }
  }

  return status
}

module.exports = { isTermLocked, autoLockGrades, getLockStatus }