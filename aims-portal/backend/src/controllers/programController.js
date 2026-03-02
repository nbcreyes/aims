const Program = require('../models/Program')

const getPrograms = async (req, res) => {
  try {
    const programs = await Program.find().sort({ name: 1 })
    res.json({ status: 'success', message: 'Programs fetched', data: programs })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
    if (!program) {
      return res.status(404).json({ status: 'error', message: 'Program not found' })
    }
    res.json({ status: 'success', message: 'Program fetched', data: program })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const createProgram = async (req, res) => {
  try {
    const { name, code, department, years, pricePerUnit, miscFee } = req.body

    if (!name || !code || !department || !years || !pricePerUnit || miscFee === undefined) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' })
    }

    const existing = await Program.findOne({ code: code.toUpperCase() })
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Program code already exists' })
    }

    const program = await Program.create({ name, code, department, years, pricePerUnit, miscFee })
    res.status(201).json({ status: 'success', message: 'Program created', data: program })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
    if (!program) {
      return res.status(404).json({ status: 'error', message: 'Program not found' })
    }

    const updated = await Program.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    res.json({ status: 'success', message: 'Program updated', data: updated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
    if (!program) {
      return res.status(404).json({ status: 'error', message: 'Program not found' })
    }

    await Program.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Program deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = { getPrograms, getProgram, createProgram, updateProgram, deleteProgram }