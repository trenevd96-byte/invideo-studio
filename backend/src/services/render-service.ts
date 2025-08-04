import ffmpeg from 'fluent-ffmpeg'
import { Queue, Worker, Job } from 'bullmq'
import { SupabaseService } from './supabase-service'
import { logger } from '../utils/logger'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

interface RenderJob {
  projectId: string
  userId: string
  scenes: Scene[]
  settings: RenderSettings
  outputFormat: string
  quality: string
}

interface Scene {
  id: string
  duration: number
  layers: Layer[]
  transitions?: Transition[]
}

interface Layer {
  id: string
  type: 'video' | 'image' | 'text' | 'audio'
  startTime: number
  duration: number
  x: number
  y: number
  width: number
  height: number
  content?: string
  source?: string
  style?: any
  effects?: any[]
}

interface Transition {
  type: 'fade' | 'cut' | 'slide' | 'zoom' | 'wipe'
  duration: number
}

interface RenderSettings {
  width: number
  height: number
  frameRate: number
  bitrate?: string
  audioSampleRate?: number
  quality: 'draft' | 'standard' | 'high' | 'ultra'
}

export class RenderService {
  private renderQueue: Queue
  private supabase: SupabaseService
  private tempDir: string
  private outputDir: string

  constructor() {
    this.supabase = new SupabaseService()
    this.tempDir = process.env.TEMP_DIR || '/app/temp'
    this.outputDir = process.env.OUTPUT_DIR || '/app/uploads'
    
    // Initialize BullMQ
    this.renderQueue = new Queue('video-render', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    })

    this.initializeWorker()
  }

  private initializeWorker() {
    const worker = new Worker('video-render', async (job: Job<RenderJob>) => {
      return await this.processRenderJob(job)
    }, {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      },
      concurrency: parseInt(process.env.RENDER_CONCURRENCY || '2')
    })

    worker.on('completed', (job) => {
      logger.info(`Render job ${job.id} completed for project ${job.data.projectId}`)
    })

    worker.on('failed', (job, err) => {
      logger.error(`Render job ${job?.id} failed:`, err)
    })

    worker.on('progress', (job, progress) => {
      logger.info(`Render job ${job.id} progress: ${progress}%`)
    })
  }

  async queueRender(renderJob: RenderJob): Promise<string> {
    const job = await this.renderQueue.add('render-video', renderJob, {
      priority: this.getPriority(renderJob.settings.quality),
      delay: 0
    })

    // Store job info in database
    await this.supabase.client
      .from('render_jobs')
      .insert({
        id: job.id,
        project_id: renderJob.projectId,
        user_id: renderJob.userId,
        status: 'queued',
        settings: renderJob.settings,
        created_at: new Date().toISOString()
      })

    return job.id as string
  }

  async getRenderStatus(jobId: string) {
    const job = await this.renderQueue.getJob(jobId)
    if (!job) {
      throw new Error('Render job not found')
    }

    const state = await job.getState()
    const progress = job.progress || 0

    return {
      id: jobId,
      status: state,
      progress,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
      failedReason: job.failedReason,
      returnValue: job.returnvalue
    }
  }

  async cancelRender(jobId: string) {
    const job = await this.renderQueue.getJob(jobId)
    if (!job) {
      throw new Error('Render job not found')
    }

    await job.remove()
    
    // Update database
    await this.supabase.client
      .from('render_jobs')
      .update({ status: 'cancelled' })
      .eq('id', jobId)

    return true
  }

  async getUserRenderJobs(userId: string) {
    const { data, error } = await this.supabase.client
      .from('render_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch render jobs')
    }

    return data
  }

  private async processRenderJob(job: Job<RenderJob>): Promise<any> {
    const { projectId, userId, scenes, settings, outputFormat, quality } = job.data
    
    try {
      // Update job status
      await this.updateJobStatus(job.id as string, 'processing')
      await job.updateProgress(5)

      // Create working directory
      const workDir = path.join(this.tempDir, `render_${job.id}`)
      await fs.mkdir(workDir, { recursive: true })

      logger.info(`Starting render job ${job.id} for project ${projectId}`)

      // Process each scene
      const sceneFiles: string[] = []
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i]
        const sceneFile = await this.renderScene(scene, settings, workDir, i)
        sceneFiles.push(sceneFile)
        
        const progress = 5 + (i / scenes.length) * 80
        await job.updateProgress(progress)
      }

      // Concatenate scenes
      await job.updateProgress(85)
      const finalOutput = await this.concatenateScenes(sceneFiles, settings, workDir, outputFormat)

      // Upload to storage
      await job.updateProgress(95)
      const publicUrl = await this.uploadFinalVideo(finalOutput, projectId, userId)

      // Cleanup
      await this.cleanup(workDir)
      await job.updateProgress(100)

      // Update job status
      await this.updateJobStatus(job.id as string, 'completed', {
        outputUrl: publicUrl,
        fileSize: (await fs.stat(finalOutput)).size
      })

      return {
        success: true,
        outputUrl: publicUrl,
        projectId,
        jobId: job.id
      }

    } catch (error) {
      logger.error(`Render job ${job.id} failed:`, error)
      await this.updateJobStatus(job.id as string, 'failed', { error: error.message })
      throw error
    }
  }

  private async renderScene(scene: Scene, settings: RenderSettings, workDir: string, sceneIndex: number): Promise<string> {
    const sceneOutput = path.join(workDir, `scene_${sceneIndex}.mp4`)
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg()
        .size(`${settings.width}x${settings.height}`)
        .fps(settings.frameRate)
        .videoBitrate(this.getBitrate(settings.quality))
        
      // Add background (black canvas)
      command.input('color=black:size=' + settings.width + 'x' + settings.height + ':duration=' + scene.duration)
        .inputFormat('lavfi')

      // Process layers
      let filterComplex = ''
      let inputIndex = 1

      // Sort layers by z-index and start time
      const sortedLayers = scene.layers.sort((a, b) => {
        if (a.startTime !== b.startTime) return a.startTime - b.startTime
        return (a.style?.zIndex || 0) - (b.style?.zIndex || 0)
      })

      for (const layer of sortedLayers) {
        switch (layer.type) {
          case 'image':
            command.input(layer.source!)
            filterComplex += this.getImageFilter(layer, inputIndex, settings)
            inputIndex++
            break
            
          case 'video':
            command.input(layer.source!)
            filterComplex += this.getVideoFilter(layer, inputIndex, settings)
            inputIndex++
            break
            
          case 'text':
            filterComplex += this.getTextFilter(layer, settings)
            break
            
          case 'audio':
            command.input(layer.source!)
            inputIndex++
            break
        }
      }

      // Apply filters
      if (filterComplex) {
        command.complexFilter(filterComplex)
      }

      command
        .output(sceneOutput)
        .on('start', () => {
          logger.info(`Rendering scene ${sceneIndex}...`)
        })
        .on('progress', (progress) => {
          logger.debug(`Scene ${sceneIndex} progress: ${progress.percent}%`)
        })
        .on('end', () => {
          logger.info(`Scene ${sceneIndex} rendered successfully`)
          resolve(sceneOutput)
        })
        .on('error', (err) => {
          logger.error(`Scene ${sceneIndex} render failed:`, err)
          reject(err)
        })
        .run()
    })
  }

  private async concatenateScenes(sceneFiles: string[], settings: RenderSettings, workDir: string, format: string): Promise<string> {
    const outputFile = path.join(workDir, `final_output.${format}`)
    const listFile = path.join(workDir, 'scenes.txt')
    
    // Create file list for FFmpeg concat
    const fileList = sceneFiles.map(file => `file '${file}'`).join('\n')
    await fs.writeFile(listFile, fileList)

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c', 'copy',
          '-movflags', '+faststart'
        ])
        .output(outputFile)
        .on('start', () => {
          logger.info('Concatenating scenes...')
        })
        .on('end', () => {
          logger.info('Scene concatenation completed')
          resolve(outputFile)
        })
        .on('error', (err) => {
          logger.error('Scene concatenation failed:', err)
          reject(err)
        })
        .run()
    })
  }

  private getImageFilter(layer: Layer, inputIndex: number, settings: RenderSettings): string {
    const x = layer.x || 0
    const y = layer.y || 0
    const width = layer.width || settings.width
    const height = layer.height || settings.height
    const startTime = layer.startTime || 0
    const duration = layer.duration || 5

    return `[${inputIndex}:v]scale=${width}:${height}[img${inputIndex}];[0:v][img${inputIndex}]overlay=${x}:${y}:enable='between(t,${startTime},${startTime + duration})'[v${inputIndex}];`
  }

  private getVideoFilter(layer: Layer, inputIndex: number, settings: RenderSettings): string {
    const x = layer.x || 0
    const y = layer.y || 0
    const width = layer.width || settings.width
    const height = layer.height || settings.height
    const startTime = layer.startTime || 0
    const duration = layer.duration || 5

    return `[${inputIndex}:v]scale=${width}:${height}[vid${inputIndex}];[0:v][vid${inputIndex}]overlay=${x}:${y}:enable='between(t,${startTime},${startTime + duration})'[v${inputIndex}];`
  }

  private getTextFilter(layer: Layer, settings: RenderSettings): string {
    const x = layer.x || 0
    const y = layer.y || 0
    const fontSize = layer.style?.fontSize || 24
    const fontColor = layer.style?.color || 'white'
    const startTime = layer.startTime || 0
    const duration = layer.duration || 5
    const text = layer.content || 'Text'

    return `drawtext=text='${text.replace(/'/g, "\\'")}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${fontColor}:enable='between(t,${startTime},${startTime + duration})';`
  }

  private getBitrate(quality: string): string {
    const bitrates = {
      draft: '500k',
      standard: '2000k',
      high: '5000k',
      ultra: '10000k'
    }
    return bitrates[quality as keyof typeof bitrates] || bitrates.standard
  }

  private getPriority(quality: string): number {
    const priorities = {
      draft: 1,
      standard: 2,
      high: 3,
      ultra: 4
    }
    return priorities[quality as keyof typeof priorities] || 2
  }

  private async uploadFinalVideo(filePath: string, projectId: string, userId: string): Promise<string> {
    const fileName = `${projectId}_${Date.now()}.mp4`
    const fileBuffer = await fs.readFile(filePath)
    
    return await this.supabase.uploadFile(
      'videos',
      fileName,
      fileBuffer,
      'video/mp4'
    )
  }

  private async updateJobStatus(jobId: string, status: string, metadata?: any) {
    await this.supabase.client
      .from('render_jobs')
      .update({ 
        status, 
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }

  private async cleanup(workDir: string) {
    try {
      await fs.rm(workDir, { recursive: true, force: true })
      logger.info(`Cleaned up working directory: ${workDir}`)
    } catch (error) {
      logger.warn(`Failed to cleanup working directory: ${error.message}`)
    }
  }

  async generateThumbnail(videoPath: string, timestamp: number = 1): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const thumbnailPath = path.join(this.tempDir, `thumb_${uuidv4()}.png`)
      
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '320x180'
        })
        .on('end', async () => {
          try {
            const buffer = await fs.readFile(thumbnailPath)
            await fs.unlink(thumbnailPath) // Cleanup
            resolve(buffer)
          } catch (error) {
            reject(error)
          }
        })
        .on('error', reject)
    })
  }

  async getQueueStats() {
    const waiting = await this.renderQueue.getWaiting()
    const active = await this.renderQueue.getActive()
    const completed = await this.renderQueue.getCompleted()
    const failed = await this.renderQueue.getFailed()

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    }
  }
}