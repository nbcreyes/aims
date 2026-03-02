const cors = require('cors')

const corsOptions = {
  origin: [process.env.CLIENT_URL, process.env.AIMS_LEARN_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

module.exports = cors(corsOptions)