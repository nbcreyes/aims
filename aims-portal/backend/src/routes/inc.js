const express = require('express')
const router = express.Router()
const { markINC, resolveINC, getINCGrades, getMyINCGrades } = require('../controllers/incController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/my', protect, allowRoles('student'), getMyINCGrades)
router.get('/', protect, allowRoles('superadmin', 'registrar', 'teacher'), getINCGrades)
router.post('/mark', protect, allowRoles('teacher', 'superadmin', 'registrar'), markINC)
router.post('/resolve', protect, allowRoles('teacher', 'superadmin', 'registrar'), resolveINC)

module.exports = router