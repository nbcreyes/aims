const express = require('express')
const router = express.Router()
const { getSubjects, getSubject, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/', protect, getSubjects)
router.get('/:id', protect, getSubject)
router.post('/', protect, allowRoles('superadmin', 'registrar'), createSubject)
router.put('/:id', protect, allowRoles('superadmin', 'registrar'), updateSubject)
router.delete('/:id', protect, allowRoles('superadmin'), deleteSubject)

module.exports = router