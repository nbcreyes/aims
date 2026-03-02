const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const {
  getApplications,
  getApplication,
  submitApplication,
  updateApplicationStatus,
  deleteApplication
} = require('../controllers/applicationController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only jpg, jpeg, png, and pdf files are allowed'))
    }
  }
})

// Public — applicants submit without an account
router.post('/submit', upload.any(), submitApplication)

// Protected — registrar/superadmin manage applications
router.get('/', protect, allowRoles('superadmin', 'registrar'), getApplications)
router.get('/:id', protect, allowRoles('superadmin', 'registrar'), getApplication)
router.put('/:id/status', protect, allowRoles('superadmin', 'registrar'), updateApplicationStatus)
router.delete('/:id', protect, allowRoles('superadmin', 'registrar'), deleteApplication)

module.exports = router