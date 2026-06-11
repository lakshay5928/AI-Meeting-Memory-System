import { v2 as cloudinary } from 'cloudinary'
import { config } from '../config'

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key:    config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
})

export function isCloudinaryConfigured(): boolean {
  return !!(
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret &&
    config.cloudinary.cloudName !== 'your_cloud_name'
  )
}

export async function uploadAudio(
  filePath: string,
  folder = 'amms/recordings',
): Promise<{ url: string; publicId: string; duration?: number }> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, ' +
      'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env\n' +
      'Get free credentials at: https://cloudinary.com'
    )
  }

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: 'video', // Cloudinary uses 'video' for audio too
    folder,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  })
  return {
    url:       result.secure_url,
    publicId:  result.public_id,
    duration:  result.duration,
  }
}

export async function deleteFile(publicId: string) {
  if (!isCloudinaryConfigured()) return
  return cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
}

export default cloudinary
