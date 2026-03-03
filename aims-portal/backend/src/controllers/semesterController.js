const Semester = require('../models/Semester')

const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ createdAt: -1 })
    res.json({ status: 'success', message: 'Semesters fetched', data: semesters })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getActiveSemester = async (req, res) => {
  try {
    const semester = await Semester.findOne({ isActive: true })
    if (!semester) {
      return res.status(404).json({ status: 'error', message: 'No active semester found' })
    }
    res.json({ status: 'success', message: 'Active semester fetched', data: semester })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const createSemester = async (req, res) => {
  try {
    const { schoolYear, term, startDate, endDate, isActive } = req.body

    if (!schoolYear || !term || !startDate || !endDate) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' })
    }

    const validTerms = ['1st Semester', '2nd Semester', 'Summer']
    if (!validTerms.includes(term)) {
      return res.status(400).json({
        status: 'error',
        message: 'Term must be 1st Semester, 2nd Semester, or Summer'
      })
    }

    // Only one active semester at a time
    if (isActive) {
      await Semester.updateMany({}, { isActive: false })
    }

    const semester = await Semester.create({
      schoolYear, term, startDate, endDate,
      isActive: isActive || false
    })

    res.status(201).json({ status: 'success', message: 'Semester created', data: semester })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateSemester = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id)
    if (!semester) {
      return res.status(404).json({ status: 'error', message: 'Semester not found' })
    }

    if (req.body.isActive) {
      await Semester.updateMany({ _id: { $ne: req.params.id } }, { isActive: false })
    }

    const updated = await Semester.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    res.json({ status: 'success', message: 'Semester updated', data: updated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id)
    if (!semester) {
      return res.status(404).json({ status: 'error', message: 'Semester not found' })
    }

    await Semester.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Semester deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  getSemesters,
  getActiveSemester,
  createSemester,
  updateSemester,
  deleteSemester
}