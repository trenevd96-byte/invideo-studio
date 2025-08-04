import { Router } from 'express'
import { RenderService } from '../services/render-service'
import { validateRequest } from '../middleware/validate-request'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../utils/async-handler'
import Joi from 'joi'

const router = Router()
const renderService = new RenderService()

// Validation schemas
const renderJobSchema = Joi.object({
  projectId: Joi.string().required(),
  scenes: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      duration: Joi.number().positive().required(),
      layers: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          type: Joi.string().valid('video', 'image', 'text', 'audio').required(),
          startTime: Joi.number().min(0).required(),
          duration: Joi.number().positive().required(),
          x: Joi.number().default(0),
          y: Joi.number().default(0),
          width: Joi.number().positive().required(),
          height: Joi.number().positive().required(),
          content: Joi.string().optional(),
          source: Joi.string().optional(),
          style: Joi.object().optional(),
          effects: Joi.array().optional()
        })
      ).required(),
      transitions: Joi.array().items(
        Joi.object({
          type: Joi.string().valid('fade', 'cut', 'slide', 'zoom', 'wipe').required(),
          duration: Joi.number().positive().required()
        })
      ).optional()
    })
  ).min(1).required(),
  settings: Joi.object({
    width: Joi.number().positive().default(1920),
    height: Joi.number().positive().default(1080),
    frameRate: Joi.number().positive().default(30),
    bitrate: Joi.string().optional(),
    audioSampleRate: Joi.number().positive().default(44100),
    quality: Joi.string().valid('draft', 'standard', 'high', 'ultra').default('standard')
  }).required(),
  outputFormat: Joi.string().valid('mp4', 'mov', 'avi', 'webm').default('mp4'),
  quality: Joi.string().valid('draft', 'standard', 'high', 'ultra').default('standard')
})

// Queue a new render job
router.post('/queue',
  requireAuth,
  validateRequest(renderJobSchema),
  asyncHandler(async (req, res) => {
    const renderJobData = {
      ...req.body,
      userId: req.user.id
    }

    const jobId = await renderService.queueRender(renderJobData)

    res.json({
      success: true,
      data: {
        jobId,
        message: 'Render job queued successfully',
        estimatedTime: `${Math.ceil(renderJobData.scenes.length * 2)} minutes`
      }
    })
  })
)

// Get render job status
router.get('/status/:jobId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { jobId } = req.params
    const status = await renderService.getRenderStatus(jobId)

    res.json({
      success: true,
      data: status
    })
  })
)

// Cancel render job
router.delete('/cancel/:jobId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { jobId } = req.params
    await renderService.cancelRender(jobId)

    res.json({
      success: true,
      message: 'Render job cancelled successfully'
    })
  })
)

// Get user's render jobs
router.get('/jobs',
  requireAuth,
  asyncHandler(async (req, res) => {
    const jobs = await renderService.getUserRenderJobs(req.user.id)

    res.json({
      success: true,
      data: {
        jobs,
        total: jobs.length
      }
    })
  })
)

// Get render queue statistics (admin only)
router.get('/queue/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    // TODO: Add admin check middleware
    const stats = await renderService.getQueueStats()

    res.json({
      success: true,
      data: stats
    })
  })
)

// Generate video thumbnail
router.post('/thumbnail',
  requireAuth,
  validateRequest(Joi.object({
    videoUrl: Joi.string().uri().required(),
    timestamp: Joi.number().min(0).default(1)
  })),
  asyncHandler(async (req, res) => {
    const { videoUrl, timestamp } = req.body
    
    // Download video temporarily for thumbnail generation
    // This is a simplified implementation
    const thumbnailBuffer = await renderService.generateThumbnail(videoUrl, timestamp)

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': thumbnailBuffer.length
    })
    res.send(thumbnailBuffer)
  })
)

// Webhook for render job updates (internal use)
router.post('/webhook/job-update',
  validateRequest(Joi.object({
    jobId: Joi.string().required(),
    status: Joi.string().valid('queued', 'processing', 'completed', 'failed', 'cancelled').required(),
    progress: Joi.number().min(0).max(100).optional(),
    metadata: Joi.object().optional()
  })),
  asyncHandler(async (req, res) => {
    const { jobId, status, progress, metadata } = req.body

    // Update job status in database
    // This would typically be called by the worker process
    
    res.json({
      success: true,
      message: 'Job status updated'
    })
  })
)

// Get rendering presets
router.get('/presets', asyncHandler(async (req, res) => {
  const presets = {
    quality: [
      {
        id: 'draft',
        name: 'Draft Quality',
        description: 'Fast rendering for previews',
        settings: {
          width: 640,
          height: 360,
          frameRate: 24,
          bitrate: '500k'
        }
      },
      {
        id: 'standard',
        name: 'Standard Quality',
        description: 'Good quality for most use cases',
        settings: {
          width: 1280,
          height: 720,
          frameRate: 30,
          bitrate: '2000k'
        }
      },
      {
        id: 'high',
        name: 'High Quality',
        description: 'High quality for professional use',
        settings: {
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitrate: '5000k'
        }
      },
      {
        id: 'ultra',
        name: 'Ultra Quality',
        description: 'Maximum quality for premium content',
        settings: {
          width: 1920,
          height: 1080,
          frameRate: 60,
          bitrate: '10000k'
        }
      }
    ],
    formats: [
      {
        id: 'mp4',
        name: 'MP4',
        description: 'Most compatible format',
        extension: 'mp4'
      },
      {
        id: 'webm',
        name: 'WebM',
        description: 'Web-optimized format',
        extension: 'webm'
      },
      {
        id: 'mov',
        name: 'QuickTime',
        description: 'High quality format',
        extension: 'mov'
      }
    ],
    aspectRatios: [
      { name: '16:9 (Landscape)', width: 1920, height: 1080 },
      { name: '9:16 (Portrait)', width: 1080, height: 1920 },
      { name: '1:1 (Square)', width: 1080, height: 1080 },
      { name: '4:3 (Classic)', width: 1280, height: 960 }
    ]
  }

  res.json({
    success: true,
    data: presets
  })
}))

export { router as renderRoutes }