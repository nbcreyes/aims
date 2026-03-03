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
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .trim()
}

// Document upload storage
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const docType = sanitize(file.fieldname)
    const studentName = req.body.name ? sanitize(req.body.name) : 'applicant'
    const timestamp = Date.now()
    cb(null, `${docType}-${studentName}-${timestamp}${ext}`)
  }
})

// Avatar upload storage
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`)
  }
})

const documentFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'application/pdf']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, and PDF files are allowed'), false)
  }
}

const avatarFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false)
  }
}

const upload = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: documentFilter
})

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: avatarFilter
})

module.exports = { upload, uploadAvatar }