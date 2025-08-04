import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createServer } from 'http'

// Import routes
import { healthRoutes } from './routes/health'
import { authRoutes } from './routes/auth'
import { projectRoutes } from './routes/projects'
import { aiRoutes } from './routes/ai'
import { renderRoutes } from './routes/render'
import { assetRoutes } from './routes/assets'
import { templateRoutes } from './routes/templates'
import { webhookRoutes } from './routes/webhooks'

// Import middleware
import { errorHandler } from './middleware/error-handler'
import { rateLimiter } from './middleware/rate-limiter'
import { validateEnv } from './utils/validate-env'
import { logger } from './utils/logger'

// Load environment variables
dotenv.config()

// Validate required environment variables
validateEnv()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 8000

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}
app.use(cors(corsOptions))

// General middleware
app.use(compression())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))

// Body parsing middleware
app.use('/api/webhooks', express.raw({ type: 'application/json' })) // Raw body for webhooks
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Rate limiting
app.use('/api/', rateLimiter)

// API Routes
app.use('/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/render', renderRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/webhooks', webhookRoutes)

// API documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'InVideo-Style UGC Studio API',
    version: '1.0.0',
    description: 'AI-powered video creation platform',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      projects: '/api/projects',
      ai: '/api/ai',
      render: '/api/render',
      assets: '/api/assets',
      templates: '/api/templates',
      webhooks: '/api/webhooks'
    },
    documentation: '/api/docs'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 InVideo Studio API running on port ${PORT}`)
  logger.info(`📖 API documentation: http://localhost:${PORT}/api`)
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`)
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export { app, server }