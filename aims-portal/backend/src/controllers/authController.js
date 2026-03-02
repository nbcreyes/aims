const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const UserProfile = require('../models/UserProfile')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

const setCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
}

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    // 🔒 Roles that cannot self-register — must be created by superadmin
    const restrictedRoles = ['superadmin', 'registrar', 'cashier', 'student']
    if (restrictedRoles.includes(role)) {
      return res.status(403).json({
        status: 'error',
        message: role === 'student'
      ? 'Student accounts are created through the admissions process.'
      : `The role "${role}" cannot self-register. Contact the administrator.`
      })
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'All fields are required' 
      })
    }

    const validRoles = ['superadmin', 'registrar', 'cashier', 'teacher', 'student', 'parent']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid role' 
      })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email already in use' 
      })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashed, role })
    await UserProfile.create({ userId: user._id })

    const token = generateToken(user._id)
    setCookie(res, token)

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email and password are required' 
      })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid credentials' 
      })
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Account is inactive' 
      })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Invalid credentials' 
      })
    }

    const token = generateToken(user._id)
    setCookie(res, token)

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  })
  res.json({ status: 'success', message: 'Logged out successfully' })
}

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json({ 
      status: 'success', 
      message: 'User fetched', 
      data: user 
    })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

module.exports = { register, login, logout, getMe }