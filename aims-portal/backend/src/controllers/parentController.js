const User = require('../models/User')
const UserProfile = require('../models/UserProfile')
const StudentRecord = require('../models/StudentRecord')
const Enrollment = require('../models/Enrollment')
const TermGrade = require('../models/TermGrade')
const AttendanceSession = require('../models/AttendanceSession')
const StudentFee = require('../models/StudentFee')
const Payment = require('../models/Payment')

const getMyChildren = async (req, res) => {
  try {
    const profiles = await UserProfile.find({ parentId: req.user._id })
      .populate('userId', 'name email status')

    const children = await Promise.all(profiles.map(async (p) => {
      const record = await StudentRecord.findOne({ studentId: p.userId._id })
        .populate('programId', 'name code')
      return { user: p.userId, record }
    }))

    res.json({ status: 'success', message: 'Children fetched', data: children })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getChildGrades = async (req, res) => {
  try {
    const { semesterId } = req.query
    const childId = req.params.childId

    await verifyParentChild(req.user._id, childId)

    const filter = { studentId: childId }
    if (semesterId) filter.semesterId = semesterId

    const grades = await TermGrade.find({ ...filter, isPublished: true })
      .populate({
        path: 'scheduleId',
        populate: { path: 'subjectId', select: 'name code units' }
      })
      .sort({ term: 1 })

    const grouped = {}
    for (const g of grades) {
      const key = g.scheduleId?._id?.toString()
      if (!key) continue
      if (!grouped[key]) {
        grouped[key] = {
          schedule: g.scheduleId,
          subject: g.scheduleId?.subjectId,
          terms: {}
        }
      }
      grouped[key].terms[g.term] = {
        classStanding: g.classStanding,
        cumulativeGrade: g.cumulativeGrade,
        term: g.term
      }
    }

    res.json({ status: 'success', message: 'Grades fetched', data: Object.values(grouped) })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getChildAttendance = async (req, res) => {
  try {
    const { scheduleId } = req.query
    const childId = req.params.childId

    await verifyParentChild(req.user._id, childId)

    if (!scheduleId) {
      return res.status(400).json({ status: 'error', message: 'scheduleId is required' })
    }

    const sessions = await AttendanceSession.find({ scheduleId }).sort({ date: 1 })

    const result = sessions.map(session => {
      const record = session.records.find(r => r.studentId.toString() === childId)
      return {
        date: session.date,
        status: record ? record.status : 'no record'
      }
    })

    const total = result.length
    const present = result.filter(r => r.status === 'present').length
    const late = result.filter(r => r.status === 'late').length
    const absent = result.filter(r => r.status === 'absent').length

    res.json({
      status: 'success',
      message: 'Attendance fetched',
      data: { records: result, summary: { total, present, late, absent } }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getChildFees = async (req, res) => {
  try {
    const childId = req.params.childId
    await verifyParentChild(req.user._id, childId)

    const fees = await StudentFee.find({ studentId: childId })
      .populate('semesterId', 'schoolYear term')
      .sort({ createdAt: -1 })

    res.json({ status: 'success', message: 'Fees fetched', data: fees })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getChildEnrollment = async (req, res) => {
  try {
    const { semesterId } = req.query
    const childId = req.params.childId
    await verifyParentChild(req.user._id, childId)

    const filter = { studentId: childId }
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

// Helper — ensure child belongs to parent
const verifyParentChild = async (parentId, childId) => {
  const profile = await UserProfile.findOne({
    userId: childId,
    parentId
  })
  if (!profile) {
    const error = new Error('Child not found or not linked to this parent')
    error.status = 403
    throw error
  }
}

module.exports = {
  getMyChildren,
  getChildGrades,
  getChildAttendance,
  getChildFees,
  getChildEnrollment
}