import { Router } from 'express'
import { AIService } from '../services/ai-service'
import { validateRequest } from '../middleware/validate-request'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../utils/async-handler'
import Joi from 'joi'

const router = Router()
const aiService = new AIService()

// Request validation schemas
const scriptGenerationSchema = Joi.object({
  topic: Joi.string().required().min(5).max(500),
  style: Joi.string().valid('professional', 'casual', 'educational', 'promotional').default('professional'),
  duration: Joi.number().integer().min(15).max(600).default(60),
  audience: Joi.string().valid('general', 'business', 'students', 'creators').default('general'),
  tone: Joi.string().valid('formal', 'conversational', 'enthusiastic', 'authoritative').default('conversational'),
  additionalContext: Joi.string().max(1000).optional()
})

const storyboardSchema = Joi.object({
  script: Joi.string().required().min(10).max(5000),
  scenes: Joi.number().integer().min(1).max(20).default(5),
  style: Joi.string().valid('cinematic', 'documentary', 'presentation', 'social').default('presentation'),
  transitions: Joi.boolean().default(true)
})

const voiceGenerationSchema = Joi.object({
  text: Joi.string().required().min(1).max(5000),
  voice: Joi.string().valid('male', 'female', 'child', 'elderly').default('female'),
  speed: Joi.number().min(0.5).max(2.0).default(1.0),
  pitch: Joi.number().min(0.5).max(2.0).default(1.0),
  emotion: Joi.string().valid('neutral', 'happy', 'sad', 'excited', 'calm').default('neutral')
})

const subtitleSchema = Joi.object({
  audioUrl: Joi.string().uri().required(),
  language: Joi.string().valid('en', 'es', 'fr', 'de', 'it', 'pt').default('en'),
  format: Joi.string().valid('srt', 'vtt', 'json').default('srt')
})

// Generate script from topic
router.post('/script', 
  requireAuth,
  validateRequest(scriptGenerationSchema),
  asyncHandler(async (req, res) => {
    const { topic, style, duration, audience, tone, additionalContext } = req.body
    
    const script = await aiService.generateScript({
      topic,
      style,
      duration,
      audience,
      tone,
      additionalContext,
      userId: req.user.id
    })
    
    res.json({
      success: true,
      data: {
        script: script.content,
        metadata: {
          wordCount: script.wordCount,
          estimatedDuration: script.estimatedDuration,
          scenes: script.suggestedScenes,
          keywords: script.keywords
        }
      }
    })
  })
)

// Generate storyboard from script
router.post('/storyboard',
  requireAuth,
  validateRequest(storyboardSchema),
  asyncHandler(async (req, res) => {
    const { script, scenes, style, transitions } = req.body
    
    const storyboard = await aiService.generateStoryboard({
      script,
      targetScenes: scenes,
      style,
      includeTransitions: transitions,
      userId: req.user.id
    })
    
    res.json({
      success: true,
      data: {
        storyboard: storyboard.scenes,
        metadata: {
          totalDuration: storyboard.totalDuration,
          sceneCount: storyboard.scenes.length,
          transitions: storyboard.transitions,
          visualSuggestions: storyboard.visualSuggestions
        }
      }
    })
  })
)

// Generate voice from text
router.post('/voice',
  requireAuth,
  validateRequest(voiceGenerationSchema),
  asyncHandler(async (req, res) => {
    const { text, voice, speed, pitch, emotion } = req.body
    
    const audioResult = await aiService.generateVoice({
      text,
      voice,
      speed,
      pitch,
      emotion,
      userId: req.user.id
    })
    
    res.json({
      success: true,
      data: {
        audioUrl: audioResult.url,
        duration: audioResult.duration,
        format: audioResult.format,
        fileSize: audioResult.fileSize,
        metadata: {
          voice,
          speed,
          pitch,
          emotion,
          characterCount: text.length
        }
      }
    })
  })
)

// Generate subtitles from audio
router.post('/subtitles',
  requireAuth,
  validateRequest(subtitleSchema),
  asyncHandler(async (req, res) => {
    const { audioUrl, language, format } = req.body
    
    const subtitles = await aiService.generateSubtitles({
      audioUrl,
      language,
      format,
      userId: req.user.id
    })
    
    res.json({
      success: true,
      data: {
        subtitles: subtitles.content,
        format: subtitles.format,
        language: subtitles.language,
        metadata: {
          duration: subtitles.duration,
          segmentCount: subtitles.segments.length,
          confidence: subtitles.averageConfidence,
          detectedLanguage: subtitles.detectedLanguage
        }
      }
    })
  })
)

// Get AI service status
router.get('/status', asyncHandler(async (req, res) => {
  const status = await aiService.getServiceStatus()
  
  res.json({
    success: true,
    data: {
      services: status,
      timestamp: new Date().toISOString()
    }
  })
}))

// Get AI usage statistics for user
router.get('/usage',
  requireAuth,
  asyncHandler(async (req, res) => {
    const usage = await aiService.getUserUsage(req.user.id)
    
    res.json({
      success: true,
      data: {
        usage,
        limits: await aiService.getUserLimits(req.user.id),
        resetDate: await aiService.getUsageResetDate(req.user.id)
      }
    })
  })
)

// Smart asset recommendations based on script/content
router.post('/asset-recommendations',
  requireAuth,
  validateRequest(Joi.object({
    content: Joi.string().required().min(10).max(1000),
    type: Joi.string().valid('video', 'image', 'audio').default('image'),
    style: Joi.string().valid('realistic', 'illustration', 'abstract', 'minimal').default('realistic'),
    mood: Joi.string().valid('professional', 'casual', 'energetic', 'calm', 'dramatic').default('professional')
  })),
  asyncHandler(async (req, res) => {
    const { content, type, style, mood } = req.body
    
    const recommendations = await aiService.getAssetRecommendations({
      content,
      type,
      style,
      mood,
      userId: req.user.id
    })
    
    res.json({
      success: true,
      data: {
        recommendations: recommendations.assets,
        keywords: recommendations.searchTerms,
        confidence: recommendations.confidence,
        alternatives: recommendations.alternatives
      }
    })
  })
)

// Generate thumbnail suggestions
router.post('/thumbnails',
  requireAuth,
  validateRequest(Joi.object({
    title: Joi.string().required().min(5).max(100),
    description: Joi.string().max(500).optional(),
    style: Joi.string().valid('youtube', 'instagram', 'tiktok', 'generic').default('youtube'),
    emotions: Joi.array().items(Joi.string()).max(3).optional(),
    colors: Joi.array().items(Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/)).max(3).optional()
  })),
  asyncHandler(async (req, res) => {
    const { title, description, style, emotions, colors } = req.body
    
    const thumbnails = await aiService.generateThumbnailSuggestions({
      title,
      description,
      style,
      emotions,
      colors,
      userId: req.user.id
    })
    
    res.json({
      success: true,
      data: {
        suggestions: thumbnails.designs,
        templates: thumbnails.templates,
        colorPalettes: thumbnails.colorPalettes,
        textSuggestions: thumbnails.textVariations
      }
    })
  })
)

export { router as aiRoutes }