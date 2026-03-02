const Subject = require('../models/Subject')

const getSubjects = async (req, res) => {
  try {
    const filter = {}
    if (req.query.programId) filter.programId = req.query.programId
    if (req.query.yearLevel) filter.yearLevel = req.query.yearLevel
    if (req.query.term) filter.term = req.query.term

    const subjects = await Subject.find(filter).populate('programId', 'name code').sort({ code: 1 })
    res.json({ status: 'success', message: 'Subjects fetched', data: subjects })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('programId', 'name code')
    if (!subject) {
      return res.status(404).json({ status: 'error', message: 'Subject not found' })
    }
    res.json({ status: 'success', message: 'Subject fetched', data: subject })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const createSubject = async (req, res) => {
  try {
    const { programId, code, name, units, yearLevel, term, hasLab, labFee } = req.body

    if (!programId || !code || !name || !units || !yearLevel || !term) {
      return res.status(400).json({ status: 'error', message: 'All required fields must be provided' })
    }

    const subject = await Subject.create({ programId, code, name, units, yearLevel, term, hasLab, labFee })
    res.status(201).json({ status: 'success', message: 'Subject created', data: subject })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
    if (!subject) {
      return res.status(404).json({ status: 'error', message: 'Subject not found' })
    }

    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    res.json({ status: 'success', message: 'Subject updated', data: updated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
    if (!subject) {
      return res.status(404).json({ status: 'error', message: 'Subject not found' })
    }

    await Subject.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Subject deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = { getSubjects, getSubject, createSubject, updateSubject, deleteSubject }