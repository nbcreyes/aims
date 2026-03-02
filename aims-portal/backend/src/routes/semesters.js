const express = require('express')
const router = express.Router()
const { getSemesters, getActiveSemester, createSemester, updateSemester, deleteSemester } = require('../controllers/semesterController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/', protect, getSemesters)
router.get('/active', protect, getActiveSemester)
router.post('/', protect, allowRoles('superadmin', 'registrar'), createSemester)
router.put('/:id', protect, allowRoles('superadmin', 'registrar'), updateSemester)
router.delete('/:id', protect, allowRoles('superadmin'), deleteSemester)

module.exports = router