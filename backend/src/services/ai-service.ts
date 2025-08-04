import OpenAI from 'openai'
import axios from 'axios'
import { SupabaseService } from './supabase-service'
import { logger } from '../utils/logger'

interface ScriptGenerationOptions {
  topic: string
  style: string
  duration: number
  audience: string
  tone: string
  additionalContext?: string
  userId: string
}

interface StoryboardGenerationOptions {
  script: string
  targetScenes: number
  style: string
  includeTransitions: boolean
  userId: string
}

interface VoiceGenerationOptions {
  text: string
  voice: string
  speed: number
  pitch: number
  emotion: string
  userId: string
}

interface SubtitleGenerationOptions {
  audioUrl: string
  language: string
  format: string
  userId: string
}

export class AIService {
  private openai: OpenAI
  private supabase: SupabaseService
  private elevenlabsApiKey: string

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.supabase = new SupabaseService()
    this.elevenlabsApiKey = process.env.ELEVENLABS_API_KEY || ''
  }

  async generateScript(options: ScriptGenerationOptions) {
    const { topic, style, duration, audience, tone, additionalContext, userId } = options

    try {
      // Check user limits
      await this.checkUserLimits(userId, 'script_generation')

      const prompt = this.buildScriptPrompt({
        topic,
        style,
        duration,
        audience,
        tone,
        additionalContext
      })

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional video script writer specializing in ${style} content for ${audience} audience. 
                     Create engaging, well-structured scripts that are optimized for video content.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })

      const scriptContent = completion.choices[0]?.message?.content || ''
      
      // Analyze the generated script
      const analysis = await this.analyzeScript(scriptContent)
      
      // Track usage
      await this.trackUsage(userId, 'script_generation', {
        topic,
        wordCount: analysis.wordCount,
        tokensUsed: completion.usage?.total_tokens || 0
      })

      return {
        content: scriptContent,
        wordCount: analysis.wordCount,
        estimatedDuration: analysis.estimatedDuration,
        suggestedScenes: analysis.suggestedScenes,
        keywords: analysis.keywords
      }
    } catch (error) {
      logger.error('Script generation failed:', error)
      throw new Error('Failed to generate script')
    }
  }

  async generateStoryboard(options: StoryboardGenerationOptions) {
    const { script, targetScenes, style, includeTransitions, userId } = options

    try {
      await this.checkUserLimits(userId, 'storyboard_generation')

      const prompt = `
        Create a detailed storyboard for the following script, breaking it into ${targetScenes} scenes.
        Style: ${style}
        Include transitions: ${includeTransitions}
        
        Script:
        ${script}
        
        For each scene, provide:
        1. Scene number and title
        2. Duration (in seconds)
        3. Visual description
        4. Camera angle/shot type
        5. Key dialogue/narration
        6. Suggested background/setting
        7. Props or visual elements needed
        ${includeTransitions ? '8. Transition to next scene' : ''}
        
        Format as JSON with the following structure:
        {
          "scenes": [
            {
              "number": 1,
              "title": "Scene Title",
              "duration": 15,
              "visualDescription": "Detailed visual description",
              "cameraAngle": "medium shot",
              "dialogue": "Key dialogue",
              "background": "Background setting",
              "props": ["prop1", "prop2"],
              "transition": "fade in/out"
            }
          ],
          "totalDuration": 60,
          "visualSuggestions": ["suggestion1", "suggestion2"]
        }
      `

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional storyboard artist and video director. Create detailed, actionable storyboards.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.5
      })

      const storyboardJson = completion.choices[0]?.message?.content || '{}'
      const storyboard = JSON.parse(storyboardJson)

      // Add transitions if requested
      if (includeTransitions) {
        storyboard.transitions = this.generateTransitions(storyboard.scenes)
      }

      await this.trackUsage(userId, 'storyboard_generation', {
        sceneCount: storyboard.scenes?.length || 0,
        tokensUsed: completion.usage?.total_tokens || 0
      })

      return storyboard
    } catch (error) {
      logger.error('Storyboard generation failed:', error)
      throw new Error('Failed to generate storyboard')
    }
  }

  async generateVoice(options: VoiceGenerationOptions) {
    const { text, voice, speed, pitch, emotion, userId } = options

    try {
      await this.checkUserLimits(userId, 'voice_generation')

      if (!this.elevenlabsApiKey) {
        throw new Error('ElevenLabs API key not configured')
      }

      // Map voice options to ElevenLabs voice IDs
      const voiceMap = {
        'male': 'pNInz6obpgDQGcFmaJgB', // Adam
        'female': 'EXAVITQu4vr4xnSDxMaL', // Bella
        'child': 'yoZ06aMxZJJ28mfd3POQ', // Sam
        'elderly': 'pqHfZKP75CvOlQylNhV4' // Bill
      }

      const voiceId = voiceMap[voice as keyof typeof voiceMap] || voiceMap.female

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: emotion === 'neutral' ? 0 : 0.5,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenlabsApiKey
          },
          responseType: 'arraybuffer'
        }
      )

      // Upload audio to Supabase Storage
      const fileName = `voice_${userId}_${Date.now()}.mp3`
      const audioUrl = await this.supabase.uploadFile(
        'audio',
        fileName,
        Buffer.from(response.data),
        'audio/mpeg'
      )

      // Estimate duration (rough calculation: ~150 words per minute)
      const wordCount = text.split(' ').length
      const estimatedDuration = Math.ceil((wordCount / 150) * 60)

      await this.trackUsage(userId, 'voice_generation', {
        characterCount: text.length,
        voice,
        duration: estimatedDuration
      })

      return {
        url: audioUrl,
        duration: estimatedDuration,
        format: 'mp3',
        fileSize: response.data.byteLength
      }
    } catch (error) {
      logger.error('Voice generation failed:', error)
      throw new Error('Failed to generate voice')
    }
  }

  async generateSubtitles(options: SubtitleGenerationOptions) {
    const { audioUrl, language, format, userId } = options

    try {
      await this.checkUserLimits(userId, 'subtitle_generation')

      // Download audio file
      const audioResponse = await axios.get(audioUrl, { responseType: 'stream' })
      
      // Create transcription using Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioResponse.data,
        model: 'whisper-1',
        language,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      })

      // Format subtitles based on requested format
      let formattedSubtitles: string
      switch (format) {
        case 'srt':
          formattedSubtitles = this.formatAsSRT(transcription.segments || [])
          break
        case 'vtt':
          formattedSubtitles = this.formatAsVTT(transcription.segments || [])
          break
        case 'json':
          formattedSubtitles = JSON.stringify(transcription.segments, null, 2)
          break
        default:
          formattedSubtitles = this.formatAsSRT(transcription.segments || [])
      }

      await this.trackUsage(userId, 'subtitle_generation', {
        duration: transcription.duration,
        language,
        segmentCount: transcription.segments?.length || 0
      })

      return {
        content: formattedSubtitles,
        format,
        language,
        duration: transcription.duration,
        segments: transcription.segments || [],
        averageConfidence: this.calculateAverageConfidence(transcription.segments || []),
        detectedLanguage: transcription.language
      }
    } catch (error) {
      logger.error('Subtitle generation failed:', error)
      throw new Error('Failed to generate subtitles')
    }
  }

  async getServiceStatus() {
    const status = {
      openai: false,
      elevenlabs: false,
      timestamp: new Date().toISOString()
    }

    try {
      // Test OpenAI
      await this.openai.models.list()
      status.openai = true
    } catch (error) {
      logger.warn('OpenAI service check failed:', error)
    }

    try {
      // Test ElevenLabs
      if (this.elevenlabsApiKey) {
        await axios.get('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': this.elevenlabsApiKey }
        })
        status.elevenlabs = true
      }
    } catch (error) {
      logger.warn('ElevenLabs service check failed:', error)
    }

    return status
  }

  async getUserUsage(userId: string) {
    // Get usage from database
    const { data, error } = await this.supabase.client
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    if (error) {
      logger.error('Failed to get user usage:', error)
      return {}
    }

    return this.aggregateUsage(data || [])
  }

  async getUserLimits(userId: string) {
    // Get user subscription tier to determine limits
    const { data: user } = await this.supabase.client
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    const tier = user?.subscription_tier || 'free'
    
    return this.getLimitsByTier(tier)
  }

  async getUsageResetDate(userId: string) {
    // For monthly limits, reset on the 1st of each month
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return nextMonth.toISOString()
  }

  async getAssetRecommendations(options: {
    content: string
    type: string
    style: string
    mood: string
    userId: string
  }) {
    try {
      const prompt = `
        Based on this content: "${options.content}"
        
        Suggest relevant ${options.type} assets with these characteristics:
        - Style: ${options.style}
        - Mood: ${options.mood}
        
        Provide search keywords and descriptions for finding appropriate assets.
        Format as JSON:
        {
          "searchTerms": ["term1", "term2", "term3"],
          "assets": [
            {
              "description": "Asset description",
              "keywords": ["keyword1", "keyword2"],
              "style": "style description",
              "mood": "mood description"
            }
          ],
          "alternatives": ["alternative1", "alternative2"]
        }
      `

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in visual content curation and asset selection for video production.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}')
      result.confidence = 0.85 // Mock confidence score

      return result
    } catch (error) {
      logger.error('Asset recommendation failed:', error)
      throw new Error('Failed to get asset recommendations')
    }
  }

  async generateThumbnailSuggestions(options: {
    title: string
    description?: string
    style: string
    emotions?: string[]
    colors?: string[]
    userId: string
  }) {
    try {
      const prompt = `
        Create thumbnail design suggestions for a video with:
        Title: "${options.title}"
        Description: "${options.description || 'N/A'}"
        Platform style: ${options.style}
        Emotions: ${options.emotions?.join(', ') || 'neutral'}
        Color preferences: ${options.colors?.join(', ') || 'any'}
        
        Provide design suggestions as JSON:
        {
          "designs": [
            {
              "layout": "layout description",
              "textPlacement": "text placement",
              "visualElements": ["element1", "element2"],
              "colorScheme": ["color1", "color2", "color3"],
              "typography": "font style suggestion"
            }
          ],
          "templates": ["template1", "template2"],
          "colorPalettes": [
            {
              "name": "palette name",
              "colors": ["#color1", "#color2", "#color3"],
              "mood": "mood description"
            }
          ],
          "textVariations": ["variation1", "variation2"]
        }
      `

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional graphic designer specializing in video thumbnails and visual marketing.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8
      })

      return JSON.parse(completion.choices[0]?.message?.content || '{}')
    } catch (error) {
      logger.error('Thumbnail suggestion failed:', error)
      throw new Error('Failed to generate thumbnail suggestions')
    }
  }

  // Private helper methods

  private buildScriptPrompt(options: {
    topic: string
    style: string
    duration: number
    audience: string
    tone: string
    additionalContext?: string
  }) {
    return `
      Create a ${options.duration}-second video script about: ${options.topic}
      
      Requirements:
      - Style: ${options.style}
      - Target audience: ${options.audience}
      - Tone: ${options.tone}
      - Duration: ${options.duration} seconds
      ${options.additionalContext ? `- Additional context: ${options.additionalContext}` : ''}
      
      The script should:
      1. Have a compelling hook in the first 5 seconds
      2. Be engaging and well-paced for video content
      3. Include natural speech patterns and pauses
      4. End with a clear call-to-action
      5. Be approximately ${Math.floor(options.duration / 4)} words (250 words per minute speaking rate)
      
      Format the script with clear dialogue and brief stage directions in parentheses.
    `
  }

  private async analyzeScript(script: string) {
    const words = script.split(/\s+/).filter(word => word.length > 0)
    const wordCount = words.length
    const estimatedDuration = Math.ceil((wordCount / 250) * 60) // 250 words per minute
    
    // Extract potential scene markers
    const suggestedScenes = this.extractSceneMarkers(script)
    
    // Extract keywords
    const keywords = this.extractKeywords(script)
    
    return {
      wordCount,
      estimatedDuration,
      suggestedScenes,
      keywords
    }
  }

  private extractSceneMarkers(script: string): string[] {
    // Simple scene detection based on common patterns
    const sceneMarkers = []
    const lines = script.split('\n')
    
    for (const line of lines) {
      if (line.includes('SCENE') || line.includes('CUT TO') || line.match(/^\d+\./)) {
        sceneMarkers.push(line.trim())
      }
    }
    
    return sceneMarkers.slice(0, 10) // Limit to 10 scenes
  }

  private extractKeywords(script: string): string[] {
    // Simple keyword extraction (in production, use more sophisticated NLP)
    const words = script.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    const wordFreq: { [key: string]: number } = {}
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    })
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  private generateTransitions(scenes: any[]) {
    const transitions = ['fade', 'cut', 'slide', 'zoom', 'wipe']
    return scenes.map((_, index) => {
      if (index === scenes.length - 1) return null
      return transitions[index % transitions.length]
    }).filter(Boolean)
  }

  private formatAsSRT(segments: any[]): string {
    return segments.map((segment, index) => {
      const startTime = this.formatTimestamp(segment.start)
      const endTime = this.formatTimestamp(segment.end)
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`
    }).join('\n')
  }

  private formatAsVTT(segments: any[]): string {
    const header = 'WEBVTT\n\n'
    const content = segments.map(segment => {
      const startTime = this.formatTimestamp(segment.start)
      const endTime = this.formatTimestamp(segment.end)
      return `${startTime} --> ${endTime}\n${segment.text}\n`
    }).join('\n')
    
    return header + content
  }

  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  private calculateAverageConfidence(segments: any[]): number {
    if (!segments.length) return 0
    
    const totalConfidence = segments.reduce((sum, segment) => {
      return sum + (segment.confidence || 0.85) // Default confidence if not provided
    }, 0)
    
    return totalConfidence / segments.length
  }

  private async checkUserLimits(userId: string, operation: string) {
    const usage = await this.getUserUsage(userId)
    const limits = await this.getUserLimits(userId)
    
    const currentUsage = usage[operation] || 0
    const limit = limits[operation] || 0
    
    if (currentUsage >= limit) {
      throw new Error(`Usage limit exceeded for ${operation}. Upgrade your plan for higher limits.`)
    }
  }

  private async trackUsage(userId: string, operation: string, metadata: any) {
    await this.supabase.client
      .from('ai_usage')
      .insert({
        user_id: userId,
        operation,
        metadata,
        created_at: new Date().toISOString()
      })
  }

  private aggregateUsage(usageData: any[]) {
    const aggregated: { [key: string]: number } = {}
    
    usageData.forEach(record => {
      const operation = record.operation
      aggregated[operation] = (aggregated[operation] || 0) + 1
    })
    
    return aggregated
  }

  private getLimitsByTier(tier: string) {
    const limits = {
      free: {
        script_generation: 5,
        storyboard_generation: 3,
        voice_generation: 10,
        subtitle_generation: 5
      },
      pro: {
        script_generation: 50,
        storyboard_generation: 30,
        voice_generation: 100,
        subtitle_generation: 50
      },
      enterprise: {
        script_generation: 500,
        storyboard_generation: 300,
        voice_generation: 1000,
        subtitle_generation: 500
      }
    }
    
    return limits[tier as keyof typeof limits] || limits.free
  }
}