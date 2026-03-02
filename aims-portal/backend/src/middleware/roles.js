const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: insufficient role'
      })
    }
    next()
  }
}

module.exports = { allowRoles }