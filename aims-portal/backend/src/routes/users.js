const express = require('express')
const router = express.Router()

const { 
  getUsers, 
  getUser, 
  updateUser, 
  updateProfile, 
  deleteUser, 
  createUser   // ✅ added
} = require('../controllers/userController')

const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

/* =========================
   CREATE USER (SUPERADMIN ONLY)
========================= */
router.post(
  '/',
  protect,
  allowRoles('superadmin'),
  createUser
)

/* =========================
   GET USERS
========================= */
router.get(
  '/',
  protect,
  allowRoles('superadmin', 'registrar'),
  getUsers
)

router.get('/:id', protect, getUser)

/* =========================
   UPDATE USER (SUPERADMIN ONLY)
========================= */
router.put(
  '/:id',
  protect,
  allowRoles('superadmin'),
  updateUser
)

router.put('/:id/profile', protect, updateProfile)

/* =========================
   DELETE USER (SUPERADMIN ONLY)
========================= */
router.delete(
  '/:id',
  protect,
  allowRoles('superadmin'),
  deleteUser
)

/* =========================
   LINK PARENT TO STUDENT
========================= */
router.put(
  '/:id/link-parent',
  protect,
  allowRoles('superadmin', 'registrar'),
  async (req, res) => {
    try {
      const { parentId } = req.body

      const profile = await require('../models/UserProfile').findOneAndUpdate(
        { userId: req.params.id },
        { parentId },
        { new: true }
      )

      res.json({
        status: 'success',
        message: 'Parent linked',
        data: profile
      })
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      })
    }
  }
)

module.exports = router