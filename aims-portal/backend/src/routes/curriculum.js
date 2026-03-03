const express = require('express')
const router = express.Router()
const {
  getCurriculum,
  addCurriculumEntry,
  updateCurriculumEntry,
  deleteCurriculumEntry
} = require('../controllers/curriculumController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/', protect, getCurriculum)
router.post('/', protect, allowRoles('superadmin', 'registrar'), addCurriculumEntry)
router.put('/:id', protect, allowRoles('superadmin', 'registrar'), updateCurriculumEntry)
router.delete('/:id', protect, allowRoles('superadmin', 'registrar'), deleteCurriculumEntry)

module.exports = router