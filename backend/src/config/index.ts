import dotenv from 'dotenv'
dotenv.config()
    
const rawRedisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const redisUrl = rawRedisUrl.includes('your-db.upstash.io') ? 'redis://localhost:6379' : rawRedisUrl

export const config = {
  env:       process.env.NODE_ENV || 'development',
  port:      parseInt(process.env.PORT || '5000', 10),
  dbUrl:     process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars',
  jwtExpiry: process.env.JWT_EXPIRES_IN || '7d',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey:    process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  // Groq free API — replaces OpenAI
  groqApiKey: process.env.GROQ_API_KEY || '',
  redis:    { url: redisUrl },
  resend:   { apiKey: process.env.RESEND_API_KEY || '' },
  fromEmail: process.env.FROM_EMAIL || 'AMMS <noreply@amms.dev>',
  origin:   process.env.APP_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
}
