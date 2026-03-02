const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Not authorized, no token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found' })
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ status: 'error', message: 'Account is inactive' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Token invalid or expired' })
  }
}

module.exports = { protect }