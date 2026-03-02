const multer = require('multer')
const path = require('path')
const fs = require('fs')

const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const sanitize = (str) => {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')       // spaces to hyphens
    .replace(/[^a-z0-9-]/g, '') // remove special characters
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .trim()
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const docType = sanitize(file.fieldname)
    const studentName = req.body.name ? sanitize(req.body.name) : 'applicant'
    const timestamp = Date.now()
    const filename = `${docType}-${studentName}-${timestamp}${ext}`
    cb(null, filename)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed'), false)
    }
  }
})

module.exports = { upload }