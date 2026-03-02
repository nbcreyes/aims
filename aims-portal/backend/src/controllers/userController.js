const User = require('../models/User')
const UserProfile = require('../models/UserProfile')
const StudentRecord = require('../models/StudentRecord')

const getUsers = async (req, res) => {
  try {
    const filter = {}
    if (req.query.role) filter.role = req.query.role
    if (req.query.status) filter.status = req.query.status

    const users = await User.find(filter).select('-password').sort({ name: 1 })
    res.json({ status: 'success', message: 'Users fetched', data: users })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    const profile = await UserProfile.findOne({ userId: user._id })
    const studentRecord = user.role === 'student'
      ? await StudentRecord.findOne({ studentId: user._id }).populate('programId', 'name code')
      : null

    res.json({ status: 'success', message: 'User fetched', data: { user, profile, studentRecord } })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateUser = async (req, res) => {
  try {
    const { name, email, status, role } = req.body
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, status, role },
      { new: true, runValidators: true }
    ).select('-password')

    res.json({ status: 'success', message: 'User updated', data: updated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    const { phone, address, birthdate, photo } = req.body
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

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' })
    }
    await User.findByIdAndDelete(req.params.id)
    await UserProfile.findOneAndDelete({ userId: req.params.id })
    res.json({ status: 'success', message: 'User deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = { getUsers, getUser, updateUser, updateProfile, deleteUser }