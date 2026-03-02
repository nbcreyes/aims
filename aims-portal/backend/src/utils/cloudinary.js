const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadFile = async (filePath, folder = 'aims/documents') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto'
  })
  return result.secure_url
}

const deleteFile = async (publicId) => {
  await cloudinary.uploader.destroy(publicId)
}

module.exports = { uploadFile, deleteFile }