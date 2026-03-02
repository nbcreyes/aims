const express = require('express')
const router = express.Router()
const {
  getSemesters,
  getActiveSemester,
  createSemester,
  updateSemester,
  deleteSemester
} = require('../controllers/semesterController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

// Public — needed for application form
router.get('/public', getSemesters)
router.get('/public/active', getActiveSemester)

// Protected
router.get('/active', protect, getActiveSemester)
router.get('/', protect, getSemesters)
router.post('/', protect, allowRoles('superadmin', 'registrar'), createSemester)
router.put('/:id', protect, allowRoles('superadmin', 'registrar'), updateSemester)
router.delete('/:id', protect, allowRoles('superadmin', 'registrar'), deleteSemester)

module.exports = router