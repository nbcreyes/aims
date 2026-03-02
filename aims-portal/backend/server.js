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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))