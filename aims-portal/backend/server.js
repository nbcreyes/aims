require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')
const connectDB = require('./src/config/db')
const corsMiddleware = require('./src/middleware/cors')

const app = express()

connectDB()

app.use(corsMiddleware)
app.use(express.json())
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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))