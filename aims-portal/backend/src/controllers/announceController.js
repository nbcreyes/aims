const Announcement = require('../models/Announcement')
const StudentRecord = require('../models/StudentRecord')

const getAnnouncements = async (req, res) => {
  try {
    const user = req.user
    let filter = {}

    if (user.role === 'student') {
      const record = await StudentRecord.findOne({ studentId: user._id })
      const programId = record?.programId

      filter = {
        $or: [
          { targetRole: 'all' },
          { targetRole: user.role },
          { targetProgramId: programId }
        ]
      }
    } else if (user.role === 'parent') {
      filter = {
        $or: [
          { targetRole: 'all' },
          { targetRole: 'parent' }
        ]
      }
    } else if (user.role === 'teacher') {
      filter = {
        $or: [
          { targetRole: 'all' },
          { targetRole: 'teacher' }
        ]
      }
    }

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name role')
      .populate('targetProgramId', 'name code')
      .sort({ createdAt: -1 })

    res.json({ status: 'success', message: 'Announcements fetched', data: announcements })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name role')
      .populate('targetProgramId', 'name code')
      .sort({ createdAt: -1 })

    res.json({ status: 'success', message: 'Announcements fetched', data: announcements })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name role')
      .populate('targetProgramId', 'name code')

    if (!announcement) {
      return res.status(404).json({ status: 'error', message: 'Announcement not found' })
    }

    res.json({ status: 'success', message: 'Announcement fetched', data: announcement })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetRole, targetProgramId } = req.body

    if (!title || !content) {
      return res.status(400).json({ status: 'error', message: 'Title and content are required' })
    }

    const announcement = await Announcement.create({
      createdBy: req.user._id,
      title,
      content,
      targetRole: targetRole || 'all',
      targetProgramId: targetProgramId || null
    })

    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name role')
      .populate('targetProgramId', 'name code')

    res.status(201).json({ status: 'success', message: 'Announcement created', data: populated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
    if (!announcement) {
      return res.status(404).json({ status: 'error', message: 'Announcement not found' })
    }

    const { title, content, targetRole, targetProgramId } = req.body

    if (title) announcement.title = title
    if (content) announcement.content = content
    if (targetRole) announcement.targetRole = targetRole
    announcement.targetProgramId = targetProgramId || null

    await announcement.save()

    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name role')
      .populate('targetProgramId', 'name code')

    res.json({ status: 'success', message: 'Announcement updated', data: populated })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
    if (!announcement) {
      return res.status(404).json({ status: 'error', message: 'Announcement not found' })
    }

    await Announcement.findByIdAndDelete(req.params.id)
    res.json({ status: 'success', message: 'Announcement deleted', data: null })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = {
  getAnnouncements,
  getAllAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
}