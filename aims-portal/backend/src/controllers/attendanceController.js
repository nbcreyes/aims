const AttendanceSession = require('../models/AttendanceSession')
const Enrollment = require('../models/Enrollment')
const ClassSchedule = require('../models/ClassSchedule')
const User = require('../models/User')

// Get all students enrolled in a given schedule
const getStudentsInSchedule = async (scheduleId) => {
  const schedule = await ClassSchedule.findById(scheduleId)
    .populate('sectionId')

  if (!schedule) return []

  const enrollments = await Enrollment.find({
    status: 'approved',
    subjects: scheduleId
  }).populate('studentId', 'name email')

  return enrollments.map(e => e.studentId).filter(Boolean)
}

const getSessions = async (req, res) => {
  try {
    const filter = {}
    if (req.query.scheduleId) filter.scheduleId = req.query.scheduleId

    const sessions = await AttendanceSession.find(filter)
      .populate('scheduleId')
      .populate('createdBy', 'name')
      .sort({ date: -1 })

    res.json({ status: 'success', message: 'Sessions fetched', data: sessions })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
      .populate('scheduleId')
      .populate('createdBy', 'name')
      .populate('records.studentId', 'name email')

    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' })
    }

    res.json({ status: 'success', message: 'Session fetched', data: session })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const createSession = async (req, res) => {
  try {
    const { scheduleId, date, records } = req.body

    if (!scheduleId || !date) {
      return res.status(400).json({ status: 'error', message: 'Schedule and date are required' })
    }

    // Prevent duplicate session for same schedule + date
    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0)
    const nextDay = new Date(dateOnly)
    nextDay.setDate(nextDay.getDate() + 1)

    const existing = await AttendanceSession.findOne({
      scheduleId,
      date: { $gte: dateOnly, $lt: nextDay }
    })

    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Attendance session already exists for this date' })
    }

    // Verify teacher owns this schedule
    const schedule = await ClassSchedule.findById(scheduleId)
    if (!schedule) {
      return res.status(404).json({ status: 'error', message: 'Schedule not found' })
    }

    if (req.user.role === 'teacher' && schedule.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'You are not assigned to this class' })
    }

    // If no records provided, auto-build from enrolled students defaulting to absent
    let sessionRecords = records
    if (!sessionRecords || sessionRecords.length === 0) {
      const students = await getStudentsInSchedule(scheduleId)
      sessionRecords = students.map(s => ({ studentId: s._id, status: 'absent' }))
    }

    const session = await AttendanceSession.create({
      scheduleId,
      date: new Date(date),
      createdBy: req.user._id,
      records: sessionRecords
    })

    const populated = await AttendanceSession.findById(session._id)
      .populate('scheduleId')
      .populate('createdBy', 'name')
      .populate('records.studentId', 'name email')

    res.status(201).json({ status: 'success', message: 'Attendance session created', data: populated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateSession = async (req, res) => {
  try {
    const { records } = req.body

    if (!records || records.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Records are required' })
    }

    const session = await AttendanceSession.findById(req.params.id)
      .populate('scheduleId')

    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' })
    }

    if (req.user.role === 'teacher' &&
      session.scheduleId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'You are not assigned to this class' })
    }

    session.records = records
    await session.save()

    const populated = await AttendanceSession.findById(session._id)
      .populate('scheduleId')
      .populate('createdBy', 'name')
      .populate('records.studentId', 'name email')

    res.json({ status: 'success', message: 'Attendance updated', data: populated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' })
    }

    await AttendanceSession.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Session deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getStudentsForSession = async (req, res) => {
  try {
    const { scheduleId } = req.query
    if (!scheduleId) {
      return res.status(400).json({ status: 'error', message: 'scheduleId is required' })
    }

    const students = await getStudentsInSchedule(scheduleId)
    res.json({ status: 'success', message: 'Students fetched', data: students })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getMyAttendance = async (req, res) => {
  try {
    const { scheduleId } = req.query
    if (!scheduleId) {
      return res.status(400).json({ status: 'error', message: 'scheduleId is required' })
    }

    const sessions = await AttendanceSession.find({ scheduleId })
      .sort({ date: 1 })

    const result = sessions.map(session => {
      const record = session.records.find(
        r => r.studentId.toString() === req.user._id.toString()
      )
      return {
        date: session.date,
        status: record ? record.status : 'no record',
        sessionId: session._id
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

const getAttendanceReport = async (req, res) => {
  try {
    const { scheduleId } = req.query
    if (!scheduleId) {
      return res.status(400).json({ status: 'error', message: 'scheduleId is required' })
    }

    const sessions = await AttendanceSession.find({ scheduleId })
      .populate('records.studentId', 'name email')
      .sort({ date: 1 })

    // Build per-student summary
    const studentMap = {}
    for (const session of sessions) {
      for (const record of session.records) {
        if (!record.studentId) continue
        const id = record.studentId._id.toString()
        if (!studentMap[id]) {
          studentMap[id] = {
            student: record.studentId,
            present: 0,
            late: 0,
            absent: 0,
            total: 0
          }
        }
        studentMap[id][record.status]++
        studentMap[id].total++
      }
    }

    const report = Object.values(studentMap)

    res.json({
      status: 'success',
      message: 'Attendance report fetched',
      data: { sessions: sessions.length, report }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  getStudentsForSession,
  getMyAttendance,
  getAttendanceReport
}