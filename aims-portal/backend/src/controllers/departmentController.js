const Department = require('../models/Department')

const getDepartments = async (req, res) => {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    const departments = await Department.find(filter).sort({ name: 1 })
    res.json({ status: 'success', message: 'Departments fetched', data: departments })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
    if (!department) {
      return res.status(404).json({ status: 'error', message: 'Department not found' })
    }
    res.json({ status: 'success', message: 'Department fetched', data: department })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const createDepartment = async (req, res) => {
  try {
    const { name, code, college } = req.body
    if (!name || !code || !college) {
      return res.status(400).json({ status: 'error', message: 'Name, code, and college are required' })
    }

    const existing = await Department.findOne({ code: code.toUpperCase() })
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Department code already exists' })
    }

    const department = await Department.create({ name, code, college })
    res.status(201).json({ status: 'success', message: 'Department created', data: department })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
    if (!department) {
      return res.status(404).json({ status: 'error', message: 'Department not found' })
    }

    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    res.json({ status: 'success', message: 'Department updated', data: updated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
    if (!department) {
      return res.status(404).json({ status: 'error', message: 'Department not found' })
    }

    // Check if any subjects use this department
    const Subject = require('../models/Subject')
    const subjectCount = await Subject.countDocuments({ departmentId: req.params.id })
    if (subjectCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete — ${subjectCount} subject(s) belong to this department`
      })
    }

    await Department.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Department deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
}