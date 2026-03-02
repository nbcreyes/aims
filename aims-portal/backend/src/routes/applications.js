const express = require('express')
const router = express.Router()
const {
  getApplications,
  getApplication,
  submitApplication,
  updateApplicationStatus,
  deleteApplication
} = require('../controllers/applicationController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')
const { upload } = require('../utils/upload')

const uploadFields = upload.fields([
  { name: 'form138', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'goodMoral', maxCount: 1 },
  { name: 'validId', maxCount: 1 }
])

router.post('/submit', uploadFields, submitApplication)
router.get('/', protect, allowRoles('superadmin', 'registrar'), getApplications)
router.get('/:id', protect, allowRoles('superadmin', 'registrar'), getApplication)
router.put('/:id/status', protect, allowRoles('superadmin', 'registrar'), updateApplicationStatus)
router.delete('/:id', protect, allowRoles('superadmin', 'registrar'), deleteApplication)

module.exports = router