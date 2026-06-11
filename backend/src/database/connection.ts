import mongoose from 'mongoose'
import { config } from '../config'

export async function connectDB() {
  if (!config.dbUrl || !/^mongodb(?:\+srv)?:\/\//i.test(config.dbUrl)) {
    console.error('❌ DATABASE_URL is missing or invalid. Set backend/.env with a valid mongodb:// or mongodb+srv:// URI.')
    process.exit(1)
  }

  try {
    await mongoose.connect(config.dbUrl, {
      serverSelectionTimeoutMS: 10_000,
    })
    console.log('✅ MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err)
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected')
  })
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err)
  })
}
