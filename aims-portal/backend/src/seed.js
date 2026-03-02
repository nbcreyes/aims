require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./models/User')
const UserProfile = require('./models/UserProfile')

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI)

  const existing = await User.findOne({ email: 'admin@aims.edu' })
  if (existing) {
    console.log('Superadmin already exists')
    process.exit()
  }

  const hashed = await bcrypt.hash('Admin@1234', 10)
  const user = await User.create({
    name: 'System Administrator',
    email: 'admin@aims.edu',
    password: hashed,
    role: 'superadmin',
    status: 'active'
  })

  await UserProfile.create({ userId: user._id })

  console.log('Superadmin created:')
  console.log('  Email:    admin@aims.edu')
  console.log('  Password: Admin@1234')
  console.log('  Change this password immediately after first login.')
  process.exit()
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})