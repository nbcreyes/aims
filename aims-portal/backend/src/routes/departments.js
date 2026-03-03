const express = require('express')
const router = express.Router()
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

// Public — needed for forms
router.get('/public', getDepartments)

// Protected
router.get('/', protect, getDepartments)
router.get('/:id', protect, getDepartment)
router.post('/', protect, allowRoles('superadmin', 'registrar'), createDepartment)
router.put('/:id', protect, allowRoles('superadmin', 'registrar'), updateDepartment)
router.delete('/:id', protect, allowRoles('superadmin', 'registrar'), deleteDepartment)

module.exports = router