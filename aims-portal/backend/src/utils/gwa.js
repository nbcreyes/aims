const TermGrade = require('../models/TermGrade')
const Enrollment = require('../models/Enrollment')
const ClassSchedule = require('../models/ClassSchedule')
const StudentRecord = require('../models/StudentRecord')

/**
 * Compute and save GWA for a student
 * GWA = weighted average of all final cumulative grades
 * weighted by subject units
 */
const computeGWA = async (studentId) => {
  try {
    // Get all approved enrollments
    const enrollments = await Enrollment.find({
      studentId,
      status: 'approved'
    }).populate({
      path: 'scheduleId',
      populate: { path: 'subjectId', select: 'units code name' }
    })

    if (!enrollments.length) return null

    // For each enrollment, get the finals grade
    let totalWeightedGrade = 0
    let totalUnits = 0
    const breakdown = []

    for (const enrollment of enrollments) {
      const schedule = enrollment.scheduleId
      if (!schedule?.subjectId) continue

      const units = schedule.subjectId.units || 0
      if (units === 0) continue

      // Get finals grade first, fall back to midterm, then prelim
      const finalsGrade = await TermGrade.findOne({
        studentId,
        scheduleId: schedule._id,
        term: 'finals',
        isPublished: true
      })

      const midtermGrade = await TermGrade.findOne({
        studentId,
        scheduleId: schedule._id,
        term: 'midterm',
        isPublished: true
      })

      const prelimGrade = await TermGrade.findOne({
        studentId,
        scheduleId: schedule._id,
        term: 'prelim',
        isPublished: true
      })

      const grade = finalsGrade || midtermGrade || prelimGrade
      if (!grade) continue

      const gradeValue = grade.cumulativeGrade || 0

      totalWeightedGrade += gradeValue * units
      totalUnits += units

      breakdown.push({
        subject: schedule.subjectId.code,
        units,
        grade: gradeValue,
        term: grade.term,
        passed: gradeValue >= 75
      })
    }

    if (totalUnits === 0) return null

    const gwa = parseFloat((totalWeightedGrade / totalUnits).toFixed(2))

    // Save to student record
    await StudentRecord.findOneAndUpdate(
      { studentId },
      { gwa, gwaUpdatedAt: new Date() }
    )

    return { gwa, totalUnits, breakdown }
  } catch (error) {
    console.error('GWA computation error:', error.message)
    return null
  }
}

/**
 * Compute GWA for a specific semester only
 */
const computeSemesterGWA = async (studentId, semesterId) => {
  try {
    const enrollments = await Enrollment.find({
      studentId,
      semesterId,
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

      const grade = await TermGrade.findOne({
        studentId,
        scheduleId: schedule._id,
        term: 'finals',
        isPublished: true
      }) || await TermGrade.findOne({
        studentId,
        scheduleId: schedule._id,
        term: 'midterm',
        isPublished: true
      }) || await TermGrade.findOne({
        studentId,
        scheduleId: schedule._id,
        term: 'prelim',
        isPublished: true
      })

      if (!grade) continue

      const gradeValue = grade.cumulativeGrade || 0
      totalWeightedGrade += gradeValue * units
      totalUnits += units

      breakdown.push({
        subject: schedule.subjectId.code,
        name: schedule.subjectId.name,
        units,
        grade: gradeValue,
        passed: gradeValue >= 75
      })
    }

    if (totalUnits === 0) return null

    const gwa = parseFloat((totalWeightedGrade / totalUnits).toFixed(2))
    return { gwa, totalUnits, breakdown }
  } catch (error) {
    console.error('Semester GWA error:', error.message)
    return null
  }
}

module.exports = { computeGWA, computeSemesterGWA }