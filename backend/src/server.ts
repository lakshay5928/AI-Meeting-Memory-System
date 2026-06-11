import { config } from './config'
import { connectDB } from './database/connection'
import { startWorker } from './jobs/transcriptionWorker'
import app from './app'

async function bootstrap() {
  await connectDB()

  // Start background worker only if Redis is available
  await startWorker()

  app.listen(config.port, () => {
    console.log(`🚀 AMMS API running on port ${config.port} [${config.env}]`)
    console.log(`   Health: http://localhost:${config.port}/health`)
    console.log(`   API:    http://localhost:${config.port}/api/v1/amms`)
  })

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`)
    process.exit(0)
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason)
  })
}

bootstrap()
