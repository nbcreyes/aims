const express = require('express')
const router = express.Router()
const { getSections, getSection, createSection, updateSection, deleteSection } = require('../controllers/sectionController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/', protect, getSections)
router.get('/:id', protect, getSection)
router.post('/', protect, allowRoles('superadmin', 'registrar'), createSection)
router.put('/:id', protect, allowRoles('superadmin', 'registrar'), updateSection)
router.delete('/:id', protect, allowRoles('superadmin'), deleteSection)

module.exports = router