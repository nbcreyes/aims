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
    const { programId, semesterId, yearLevel, name } = req.body

    if (!programId || !semesterId || !yearLevel || !name) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' })
    }

    const section = await Section.create({ programId, semesterId, yearLevel, name })
    res.status(201).json({ status: 'success', message: 'Section created', data: section })
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

    const updated = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    res.json({ status: 'success', message: 'Section updated', data: updated })
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

    await Section.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Section deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = { getSections, getSection, createSection, updateSection, deleteSection }