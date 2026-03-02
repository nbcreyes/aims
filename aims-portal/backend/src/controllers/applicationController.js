const Application = require('../models/Application')
const User = require('../models/User')
const UserProfile = require('../models/UserProfile')
const StudentRecord = require('../models/StudentRecord')
const bcrypt = require('bcryptjs')
const { uploadFile } = require('../utils/cloudinary')

// Generate student number: e.g. 2024-0001
const generateStudentNo = async () => {
  const year = new Date().getFullYear()
  const count = await StudentRecord.countDocuments()
  const seq = String(count + 1).padStart(4, '0')
  return `${year}-${seq}`
}

const getApplications = async (req, res) => {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.programId) filter.programId = req.query.programId
    if (req.query.semesterId) filter.semesterId = req.query.semesterId

    const applications = await Application.find(filter)
      .populate('programId', 'name code')
      .populate('semesterId', 'schoolYear term')
      .sort({ submittedAt: -1 })

    res.json({ status: 'success', message: 'Applications fetched', data: applications })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('programId', 'name code')
      .populate('semesterId', 'schoolYear term')

    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found' })
    }

    res.json({ status: 'success', message: 'Application fetched', data: application })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, address, birthdate, programId, semesterId } = req.body

    if (!name || !email || !programId || !semesterId) {
      return res.status(400).json({ status: 'error', message: 'Name, email, program, and semester are required' })
    }

    // Prevent duplicate applications for same email + semester
    const existing = await Application.findOne({ email, semesterId })
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'An application for this semester already exists for this email' })
    }

    // Check if email already has a student account
    const existingUser = await User.findOne({ email, role: 'student' })
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'This email is already registered as a student' })
    }

    // Handle document uploads
    const documents = []
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadFile(file.path)
        documents.push({ docType: file.fieldname, fileUrl: url })
      }
    }

    const application = await Application.create({
      name, email, phone, address, birthdate, programId, semesterId, documents
    })

    res.status(201).json({ status: 'success', message: 'Application submitted successfully', data: application })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateApplicationStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body
    const validStatuses = ['pending', 'under_review', 'accepted', 'rejected']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status' })
    }

    const application = await Application.findById(req.params.id)
      .populate('programId')

    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found' })
    }

    if (application.status === 'accepted') {
      return res.status(400).json({ status: 'error', message: 'Application has already been accepted' })
    }

    application.status = status
    if (remarks) application.remarks = remarks
    await application.save()

    // On acceptance — create student user account and student record
    if (status === 'accepted') {
      const existingUser = await User.findOne({ email: application.email })
      if (!existingUser) {
        const tempPassword = Math.random().toString(36).slice(-8)
        const hashed = await bcrypt.hash(tempPassword, 10)

        const newUser = await User.create({
          name: application.name,
          email: application.email,
          password: hashed,
          role: 'student'
        })

        await UserProfile.create({
          userId: newUser._id,
          phone: application.phone,
          address: application.address,
          birthdate: application.birthdate
        })

        const studentNo = await generateStudentNo()
        await StudentRecord.create({
          studentId: newUser._id,
          programId: application.programId._id,
          yearLevel: 1,
          studentNo
        })

        return res.json({
          status: 'success',
          message: `Application accepted. Student account created. Temporary password: ${tempPassword}`,
          data: { application, studentNo, tempPassword }
        })
      }
    }

    res.json({ status: 'success', message: `Application status updated to ${status}`, data: application })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found' })
    }

    if (application.status === 'accepted') {
      return res.status(400).json({ status: 'error', message: 'Cannot delete an accepted application' })
    }

    await Application.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Application deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  getApplications,
  getApplication,
  submitApplication,
  updateApplicationStatus,
  deleteApplication
}