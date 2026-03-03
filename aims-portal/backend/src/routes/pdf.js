const express = require('express')
const router = express.Router()
const { downloadReceipt, downloadReportCard, downloadCOR } = require('../controllers/pdfController')
const { protect } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roles')

router.get(
  '/receipt/:paymentId',
  protect,
  allowRoles('superadmin', 'cashier', 'student'),
  downloadReceipt
)

router.get(
  '/report-card/:studentId/:semesterId',
  protect,
  allowRoles('superadmin', 'registrar', 'student'),
  downloadReportCard
)

router.get(
  '/cor/:studentId/:semesterId',
  protect,
  allowRoles('superadmin', 'registrar', 'student'),
  downloadCOR
)

module.exports = router