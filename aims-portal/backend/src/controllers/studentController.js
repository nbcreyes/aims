const User = require('../models/User')
const UserProfile = require('../models/UserProfile')
const StudentRecord = require('../models/StudentRecord')
const Enrollment = require('../models/Enrollment')
const Program = require('../models/Program')

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
      .populate('programId', 'name code')
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

module.exports = {
  getStudents,
  getStudent,
  updateStudentRecord,
  updateStudentProfile,
  getMyRecord
}