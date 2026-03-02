const express = require('express')
const router = express.Router()
const { getPrograms, getProgram, createProgram, updateProgram, deleteProgram } = require('../controllers/programController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/', protect, getPrograms)
router.get('/:id', protect, getProgram)
router.post('/', protect, allowRoles('superadmin', 'registrar'), createProgram)
router.put('/:id', protect, allowRoles('superadmin', 'registrar'), updateProgram)
router.delete('/:id', protect, allowRoles('superadmin'), deleteProgram)

module.exports = router