import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { config } from './config'

// Route modules
import authRoutes     from './modules/meeting-capture/authRoutes'
import meetingRoutes  from './modules/meeting-capture/meetingRoutes'
import actionRoutes   from './modules/action-items/actionRoutes'
import searchRoutes   from './modules/semantic-search/searchRoutes'
import notifRoutes    from './modules/notifications/notifRoutes'
import dashboardRoutes from './modules/workspace/dashboardRoutes'

const app = express()

// ─── Security middleware ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: config.origin,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))

// ─── Rate limiting ───────────────────────────────────────────
const globalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: { code: 'RATE_LIMIT', message: 'Too many requests. Please slow down.' } },
})

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { data: null, error: { code: 'RATE_LIMIT', message: 'Too many login attempts. Please wait 15 minutes.' } },
})

app.use(globalLimit)

// ─── Body parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ─── Logging ─────────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'))
}

// ─── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: config.env, timestamp: new Date().toISOString() })
})

// ─── API routes ──────────────────────────────────────────────
const base = '/api/v1/amms'

app.use(`${base}/auth`,            authLimit, authRoutes)
app.use(`${base}/me`,              authRoutes)    // GET/PATCH /me mounted in authRoutes
app.use(`${base}/meeting`,         meetingRoutes)
app.use(`${base}/action-items`,    actionRoutes)
app.use(`${base}/transcriptsegment`, actionRoutes) // re-trigger transcription
app.use(`${base}/semantic-search`, searchRoutes)
app.use(`${base}/notifications`,   notifRoutes)
app.use(base,                      dashboardRoutes)

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    data: null,
    meta: { timestamp: new Date().toISOString() },
    error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist.' },
  })
})

// ─── Global error handler ────────────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[UnhandledError]', err)
  res.status(500).json({
    data: null,
    meta: { timestamp: new Date().toISOString() },
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  })
})

export default app
