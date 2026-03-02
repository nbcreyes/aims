const ClassSchedule = require('../models/ClassSchedule')
const Section = require('../models/Section')
const User = require('../models/User')

const getSchedules = async (req, res) => {
  try {
    const filter = {}
    if (req.query.semesterId) filter.semesterId = req.query.semesterId
    if (req.query.sectionId) filter.sectionId = req.query.sectionId
    if (req.query.teacherId) filter.teacherId = req.query.teacherId
    if (req.query.subjectId) filter.subjectId = req.query.subjectId

    const schedules = await ClassSchedule.find(filter)
      .populate('subjectId', 'name code units hasLab labFee')
      .populate('sectionId', 'name yearLevel')
      .populate('semesterId', 'schoolYear term')
      .populate('teacherId', 'name email')
      .sort({ day: 1, timeStart: 1 })

    res.json({ status: 'success', message: 'Schedules fetched', data: schedules })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getSchedule = async (req, res) => {
  try {
    const schedule = await ClassSchedule.findById(req.params.id)
      .populate('subjectId', 'name code units hasLab labFee')
      .populate('sectionId', 'name yearLevel')
      .populate('semesterId', 'schoolYear term')
      .populate('teacherId', 'name email')

    if (!schedule) {
      return res.status(404).json({ status: 'error', message: 'Schedule not found' })
    }

    res.json({ status: 'success', message: 'Schedule fetched', data: schedule })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const createSchedule = async (req, res) => {
  try {
    const { subjectId, sectionId, semesterId, teacherId, day, timeStart, timeEnd, room } = req.body

    if (!subjectId || !sectionId || !semesterId || !teacherId || !day || !timeStart || !timeEnd || !room) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' })
    }

    // Check teacher conflict — same teacher, same day, overlapping time
    const teacherConflict = await checkTimeConflict({ teacherId, day, timeStart, timeEnd, semesterId })
    if (teacherConflict) {
      return res.status(400).json({ status: 'error', message: 'Teacher has a conflicting schedule on this day and time' })
    }

    // Check room conflict — same room, same day, overlapping time
    const roomConflict = await checkTimeConflict({ room, day, timeStart, timeEnd, semesterId })
    if (roomConflict) {
      return res.status(400).json({ status: 'error', message: 'Room is already occupied at this day and time' })
    }

    // Check section conflict — same section, same day, overlapping time
    const sectionConflict = await checkTimeConflict({ sectionId, day, timeStart, timeEnd, semesterId })
    if (sectionConflict) {
      return res.status(400).json({ status: 'error', message: 'Section already has a class at this day and time' })
    }

    const schedule = await ClassSchedule.create({ subjectId, sectionId, semesterId, teacherId, day, timeStart, timeEnd, room })

    const populated = await ClassSchedule.findById(schedule._id)
      .populate('subjectId', 'name code units')
      .populate('sectionId', 'name yearLevel')
      .populate('semesterId', 'schoolYear term')
      .populate('teacherId', 'name email')

    res.status(201).json({ status: 'success', message: 'Schedule created', data: populated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateSchedule = async (req, res) => {
  try {
    const schedule = await ClassSchedule.findById(req.params.id)
    if (!schedule) {
      return res.status(404).json({ status: 'error', message: 'Schedule not found' })
    }

    const { day, timeStart, timeEnd, room, teacherId, semesterId } = req.body

    const checkDay = day || schedule.day
    const checkStart = timeStart || schedule.timeStart
    const checkEnd = timeEnd || schedule.timeEnd
    const checkRoom = room || schedule.room
    const checkTeacher = teacherId || schedule.teacherId.toString()
    const checkSemester = semesterId || schedule.semesterId.toString()
    const excludeId = schedule._id

    const teacherConflict = await checkTimeConflict({ teacherId: checkTeacher, day: checkDay, timeStart: checkStart, timeEnd: checkEnd, semesterId: checkSemester, excludeId })
    if (teacherConflict) {
      return res.status(400).json({ status: 'error', message: 'Teacher has a conflicting schedule on this day and time' })
    }

    const roomConflict = await checkTimeConflict({ room: checkRoom, day: checkDay, timeStart: checkStart, timeEnd: checkEnd, semesterId: checkSemester, excludeId })
    if (roomConflict) {
      return res.status(400).json({ status: 'error', message: 'Room is already occupied at this day and time' })
    }

    const updated = await ClassSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('subjectId', 'name code units')
      .populate('sectionId', 'name yearLevel')
      .populate('semesterId', 'schoolYear term')
      .populate('teacherId', 'name email')

    res.json({ status: 'success', message: 'Schedule updated', data: updated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteSchedule = async (req, res) => {
  try {
    const schedule = await ClassSchedule.findById(req.params.id)
    if (!schedule) {
      return res.status(404).json({ status: 'error', message: 'Schedule not found' })
    }

    await ClassSchedule.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Schedule deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getMySchedule = async (req, res) => {
  try {
    const { semesterId } = req.query
    if (!semesterId) {
      return res.status(400).json({ status: 'error', message: 'semesterId is required' })
    }

    const filter = { semesterId }
    if (req.user.role === 'teacher') {
      filter.teacherId = req.user._id
    }

    const schedules = await ClassSchedule.find(filter)
      .populate('subjectId', 'name code units')
      .populate('sectionId', 'name yearLevel')
      .populate('teacherId', 'name')
      .sort({ day: 1, timeStart: 1 })

    res.json({ status: 'success', message: 'Schedule fetched', data: schedules })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

// Helper — check for time conflicts
async function checkTimeConflict({ teacherId, room, sectionId, day, timeStart, timeEnd, semesterId, excludeId }) {
  const filter = { day, semesterId }
  if (teacherId) filter.teacherId = teacherId
  if (room) filter.room = room
  if (sectionId) filter.sectionId = sectionId
  if (excludeId) filter._id = { $ne: excludeId }

  const existing = await ClassSchedule.find(filter)

  for (const s of existing) {
    if (timesOverlap(timeStart, timeEnd, s.timeStart, s.timeEnd)) {
      return true
    }
  }
  return false
}

function timesOverlap(start1, end1, start2, end2) {
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const s1 = toMinutes(start1)
  const e1 = toMinutes(end1)
  const s2 = toMinutes(start2)
  const e2 = toMinutes(end2)
  return s1 < e2 && e1 > s2
}

module.exports = { getSchedules, getSchedule, createSchedule, updateSchedule, deleteSchedule, getMySchedule }