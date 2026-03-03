const Section = require('../models/Section')

const getSections = async (req, res) => {
  try {
    const filter = {}
    if (req.query.programId) filter.programId = req.query.programId
    if (req.query.semesterId) filter.semesterId = req.query.semesterId
    if (req.query.yearLevel) filter.yearLevel = req.query.yearLevel

    const sections = await Section.find(filter)
      .populate('programId', 'name code')
      .populate('semesterId', 'schoolYear term')
      .sort({ name: 1 })

    res.json({ status: 'success', message: 'Sections fetched', data: sections })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('programId', 'name code')
      .populate('semesterId', 'schoolYear term')

    if (!section) {
      return res.status(404).json({ status: 'error', message: 'Section not found' })
    }

    res.json({ status: 'success', message: 'Section fetched', data: section })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const createSection = async (req, res) => {
  try {
    const { programId, semesterId, yearLevel, sectionNumber, capacity } = req.body

    if (!programId || !semesterId || !yearLevel || !sectionNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'Program, semester, year level, and section number are required'
      })
    }

    // Check for duplicate
    const existing = await Section.findOne({
      programId, semesterId, yearLevel, sectionNumber
    })
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: `Section ${existing.name} already exists`
      })
    }

    const section = new Section({
      programId,
      semesterId,
      yearLevel,
      sectionNumber,
      capacity: capacity || 40
    })

    await section.save() // triggers pre-save hook to generate name

    const populated = await Section.findById(section._id)
      .populate('programId', 'name code')
      .populate('semesterId', 'schoolYear term')

    res.status(201).json({
      status: 'success',
      message: `Section ${section.name} created`,
      data: populated
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
    if (!section) {
      return res.status(404).json({ status: 'error', message: 'Section not found' })
    }

    // Update allowed fields
    const { capacity, status, sectionNumber } = req.body
    if (capacity) section.capacity = capacity
    if (status) section.status = status
    if (sectionNumber) {
      section.sectionNumber = sectionNumber
      section.name = undefined // force regeneration
    }

    await section.save()

    const populated = await Section.findById(section._id)
      .populate('programId', 'name code')
      .populate('semesterId', 'schoolYear term')

    res.json({ status: 'success', message: 'Section updated', data: populated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteSection = async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
    if (!section) {
      return res.status(404).json({ status: 'error', message: 'Section not found' })
    }

    // Check if any schedules use this section
    const Schedule = require('../models/Schedule')
    const scheduleCount = await Schedule.countDocuments({ sectionId: req.params.id })
    if (scheduleCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete — ${scheduleCount} schedule(s) use this section`
      })
    }

    await Section.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Section deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  getSections,
  getSection,
  createSection,
  updateSection,
  deleteSection
}