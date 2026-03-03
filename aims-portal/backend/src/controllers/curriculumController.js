const Curriculum = require('../models/Curriculum')

const getCurriculum = async (req, res) => {
  try {
    if (!req.query.programId) {
      return res.status(400).json({ status: 'error', message: 'programId is required' })
    }

    const curriculum = await Curriculum.find({ programId: req.query.programId })
      .populate({
        path: 'subjectId',
        populate: { path: 'departmentId', select: 'name code' }
      })
      .populate('prerequisites', 'code name units')
      .populate('corequisites', 'code name units')
      .sort({ yearLevel: 1, semester: 1, order: 1 })

    // Group by year level and semester
    const grouped = {}
    for (const entry of curriculum) {
      const key = `Year ${entry.yearLevel} — ${entry.semester}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(entry)
    }

    res.json({
      status: 'success',
      message: 'Curriculum fetched',
      data: curriculum,
      grouped
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const addCurriculumEntry = async (req, res) => {
  try {
    const {
      programId, subjectId, yearLevel,
      semester, order, prerequisites,
      corequisites, isRequired
    } = req.body

    if (!programId || !subjectId || !yearLevel || !semester) {
      return res.status(400).json({
        status: 'error',
        message: 'Program, subject, year level, and semester are required'
      })
    }

    const existing = await Curriculum.findOne({ programId, subjectId })
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'Subject already exists in this program\'s curriculum'
      })
    }

    const entry = await Curriculum.create({
      programId,
      subjectId,
      yearLevel,
      semester,
      order: order || 0,
      prerequisites: prerequisites || [],
      corequisites: corequisites || [],
      isRequired: isRequired !== undefined ? isRequired : true
    })

    const populated = await Curriculum.findById(entry._id)
      .populate({
        path: 'subjectId',
        populate: { path: 'departmentId', select: 'name code' }
      })
      .populate('prerequisites', 'code name units')
      .populate('corequisites', 'code name units')

    res.status(201).json({
      status: 'success',
      message: 'Curriculum entry added',
      data: populated
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateCurriculumEntry = async (req, res) => {
  try {
    const entry = await Curriculum.findById(req.params.id)
    if (!entry) {
      return res.status(404).json({ status: 'error', message: 'Curriculum entry not found' })
    }

    const updated = await Curriculum.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'subjectId',
        populate: { path: 'departmentId', select: 'name code' }
      })
      .populate('prerequisites', 'code name units')
      .populate('corequisites', 'code name units')

    res.json({ status: 'success', message: 'Curriculum entry updated', data: updated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteCurriculumEntry = async (req, res) => {
  try {
    const entry = await Curriculum.findById(req.params.id)
    if (!entry) {
      return res.status(404).json({ status: 'error', message: 'Curriculum entry not found' })
    }

    // Check if this subject is a prerequisite for another subject in the same program
    const dependents = await Curriculum.find({
      programId: entry.programId,
      prerequisites: entry.subjectId
    }).populate('subjectId', 'code name')

    if (dependents.length > 0) {
      const names = dependents.map(d => d.subjectId.code).join(', ')
      return res.status(400).json({
        status: 'error',
        message: `Cannot remove — this subject is a prerequisite for: ${names}`
      })
    }

    await Curriculum.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Curriculum entry removed', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  getCurriculum,
  addCurriculumEntry,
  updateCurriculumEntry,
  deleteCurriculumEntry
}