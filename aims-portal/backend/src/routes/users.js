const express = require('express')
const router = express.Router()
const { getUsers, getUser, updateUser, updateProfile, deleteUser } = require('../controllers/userController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get('/', protect, allowRoles('superadmin', 'registrar'), getUsers)
router.get('/:id', protect, getUser)
router.put('/:id', protect, allowRoles('superadmin'), updateUser)
router.put('/:id/profile', protect, updateProfile)
router.delete('/:id', protect, allowRoles('superadmin'), deleteUser)

module.exports = router