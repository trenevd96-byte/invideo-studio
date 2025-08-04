'use client'

import { useState, useCallback, useEffect } from 'react'
import { VideoEditor } from '@/components/editor/VideoEditor'
import { Timeline } from '@/components/editor/Timeline'
import { LayerPanel } from '@/components/editor/LayerPanel'
import { AssetLibrary } from '@/components/editor/AssetLibrary'
import { PreviewPanel } from '@/components/editor/PreviewPanel'
import { useEditorStore } from '@/stores/editor-store'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function EditorPage() {
  const {
    project,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    stop,
    seek,
    loadProject,
    saveProject,
    exportVideo
  } = useEditorStore()

  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load project from URL params or create new
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const projectId = urlParams.get('project')
    
    if (projectId) {
      loadProject(projectId)
    } else {
      // Create new project
      loadProject(null)
    }
  }, [loadProject])

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const handleSave = useCallback(async () => {
    if (!project) return
    
    setIsSaving(true)
    try {
      await saveProject('default-user-id')
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setIsSaving(false)
    }
  }, [project, saveProject])

  const handleExport = useCallback(async () => {
    if (!project) return
    
    setIsExporting(true)
    try {
      await exportVideo({
        quality: '1080p',
        format: 'mp4'
      })
    } catch (error) {
      console.error('Error exporting video:', error)
    } finally {
      setIsExporting(false)
    }
  }, [project, exportVideo])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">InVideo Studio</h1>
            <span className="text-gray-400">
              {project?.name || 'Untitled Project'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              💾 {isSaving ? 'Saving...' : 'Save'}
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={isExporting || !project?.scenes?.length}
              size="sm"
            >
              📥 {isExporting ? 'Exporting...' : 'Export'}
            </Button>
            
            <Button variant="outline" size="sm">
              ⚙️
            </Button>
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Asset Library & Layers */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <Tabs defaultValue="assets" className="flex-1">
            <TabsList className="grid w-full grid-cols-2 bg-gray-700">
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="assets" className="flex-1 mt-0">
              <AssetLibrary />
            </TabsContent>
            
            <TabsContent value="layers" className="flex-1 mt-0">
              <LayerPanel />
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Canvas & Preview */}
        <div className="flex-1 flex flex-col">
          {/* Canvas */}
          <div className="flex-1 relative bg-black">
            <VideoEditor />
          </div>

          {/* Preview Controls */}
          <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => seek(Math.max(0, currentTime - 10))}
              >
                ⏪
              </Button>
              
              <Button
                onClick={handlePlayPause}
                size="sm"
                className="w-12 h-12 rounded-full"
              >
                {isPlaying ? '⏸️' : '▶️'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={stop}
              >
                ⏹️
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => seek(Math.min(duration, currentTime + 10))}
              >
                ⏩
              </Button>
              
              <div className="text-sm text-gray-400 ml-4">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Preview & Properties */}
        <div className="w-80 bg-gray-800 border-l border-gray-700">
          <PreviewPanel />
        </div>
      </div>

      {/* Bottom - Timeline */}
      <div className="h-64 bg-gray-800 border-t border-gray-700">
        <Timeline />
      </div>
    </div>
  )
}