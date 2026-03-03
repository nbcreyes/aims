require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')
const connectDB = require('./src/config/db')
const corsMiddleware = require('./src/middleware/cors')
const { autoLockGrades } = require('./src/utils/gradeLock')
const { defaultOverdueINC } = require('./src/controllers/incController')

const app = express()

connectDB()

app.use(corsMiddleware)
app.use(express.json())
const path = require('path')
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'AIMS Portal API running' })
})

app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/programs', require('./src/routes/programs'))
app.use('/api/semesters', require('./src/routes/semesters'))
app.use('/api/subjects', require('./src/routes/subjects'))
app.use('/api/sections', require('./src/routes/sections'))
app.use('/api/applications', require('./src/routes/applications'))
app.use('/api/enrollments', require('./src/routes/enrollments'))
app.use('/api/schedules', require('./src/routes/schedules'))
app.use('/api/users', require('./src/routes/users'))
app.use('/api/students', require('./src/routes/students'))
app.use('/api/attendance', require('./src/routes/attendance'))
app.use('/api/grades', require('./src/routes/grades'))
app.use('/api/fees', require('./src/routes/fees'))
app.use('/api/payments', require('./src/routes/payments'))
app.use('/api/announcements', require('./src/routes/announcements'))
app.use('/api/notifications', require('./src/routes/notifications'))
app.use('/api/parent', require('./src/routes/parent'))
app.use('/api/pdf', require('./src/routes/pdf'))
app.use('/api/departments', require('./src/routes/departments'))
app.use('/api/curriculum', require('./src/routes/curriculum'))
app.use('/api/inc', require('./src/routes/inc'))
app.use('/api/removal', require('./src/routes/removal'))

autoLockGrades()
setInterval(autoLockGrades, 60 * 60 * 1000)

defaultOverdueINC()
setInterval(defaultOverdueINC, 24 * 60 * 60 * 1000)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))