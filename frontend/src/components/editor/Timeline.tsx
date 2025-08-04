'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Scissors, 
  Copy, 
  Trash2,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineProps {
  height?: number
}

interface LayerBlockProps {
  layer: any
  sceneIndex: number
  scale: number
  onSelect: (layerId: string) => void
  isSelected: boolean
  onDrag: (layerId: string, newStartTime: number, newDuration: number) => void
}

function LayerBlock({ layer, sceneIndex, scale, onSelect, isSelected, onDrag }: LayerBlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, startTime: 0, duration: 0 })

  const startTime = layer.startTime || 0
  const duration = layer.duration || 5
  const left = startTime * scale
  const width = Math.max(duration * scale, 20)

  const getLayerColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-500'
      case 'audio': return 'bg-green-500'
      case 'text': return 'bg-purple-500'
      case 'image': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      startTime,
      duration
    })
    onSelect(layer.id)
  }, [startTime, duration, layer.id, onSelect])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaTime = deltaX / scale
    const newStartTime = Math.max(0, dragStart.startTime + deltaTime)
    
    onDrag(layer.id, newStartTime, dragStart.duration)
  }, [isDragging, dragStart, scale, layer.id, onDrag])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      className={cn(
        'absolute h-8 border border-white/20 rounded cursor-move select-none',
        getLayerColor(layer.type),
        isSelected ? 'ring-2 ring-white' : '',
        isDragging ? 'opacity-80' : ''
      )}
      style={{ left, width }}
      onMouseDown={handleMouseDown}
      title={`${layer.type}: ${layer.name || layer.id}`}
    >
      <div className="px-2 py-1 text-white text-xs font-medium truncate">
        {layer.name || `${layer.type} ${layer.id.slice(-4)}`}
      </div>
      
      {/* Resize handles */}
      <div className="absolute right-0 top-0 w-2 h-full bg-white/30 cursor-ew-resize opacity-0 hover:opacity-100" />
    </div>
  )
}

export function Timeline({ height = 300 }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(20) // pixels per second
  const [playheadPosition, setPlayheadPosition] = useState(0)

  const {
    project,
    currentScene,
    currentTime,
    isPlaying,
    selectedLayerId,
    play,
    pause,
    stop,
    seek,
    updateLayer,
    selectLayer,
    deleteLayer,
    duplicateLayer,
    addScene,
    scenes
  } = useEditorStore()

  const duration = project?.duration || 60
  const timelineWidth = duration * scale

  // Update playhead position based on current time
  useEffect(() => {
    setPlayheadPosition(currentTime * scale)
  }, [currentTime, scale])

  // Handle timeline click to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = x / scale
    seek(Math.max(0, Math.min(time, duration)))
  }, [scale, duration, seek])

  // Handle layer drag
  const handleLayerDrag = useCallback((layerId: string, newStartTime: number, newDuration: number) => {
    updateLayer(layerId, {
      startTime: newStartTime,
      duration: newDuration
    })
  }, [updateLayer])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (isPlaying) pause()
          else play()
          break
        case 'Delete':
          if (selectedLayerId) {
            deleteLayer(selectedLayerId)
          }
          break
        case 'KeyC':
          if (e.ctrlKey && selectedLayerId) {
            duplicateLayer(selectedLayerId)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, selectedLayerId, play, pause, deleteLayer, duplicateLayer])

  // Time markers
  const timeMarkers = []
  for (let i = 0; i <= Math.ceil(duration); i += 5) {
    timeMarkers.push(
      <div
        key={i}
        className="absolute top-0 border-l border-gray-600 h-6 text-xs text-gray-400"
        style={{ left: i * scale }}
      >
        <span className="ml-1">{Math.floor(i / 60)}:{(i % 60).toString().padStart(2, '0')}</span>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border-t border-gray-700" style={{ height }}>
      {/* Timeline header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={isPlaying ? pause : play}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={stop}
          >
            <Square className="w-4 h-4" />
          </Button>
          <div className="text-sm text-gray-400">
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')} / {Math.floor(duration / 60)}:{(duration % 60).toFixed(1).padStart(4, '0')}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale(Math.max(scale * 0.8, 5))}
          >
            -
          </Button>
          <span className="text-sm text-gray-400 min-w-[60px] text-center">
            {Math.round(scale)}px/s
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale(Math.min(scale * 1.2, 100))}
          >
            +
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="relative" style={{ height: height - 60 }}>
          {/* Time ruler */}
          <div 
            className="relative h-8 bg-gray-900 border-b border-gray-700"
            style={{ width: timelineWidth }}
            ref={timelineRef}
            onClick={handleTimelineClick}
          >
            {timeMarkers}
            
            {/* Playhead */}
            <div
              className="absolute top-0 w-0.5 bg-red-500 z-10"
              style={{ 
                left: playheadPosition,
                height: height - 60
              }}
            >
              <div className="w-3 h-3 bg-red-500 -ml-1.5 -mt-1 rounded-full" />
            </div>
          </div>

          {/* Scene tracks */}
          <div className="space-y-1 p-2">
            {scenes.map((scene, sceneIndex) => (
              <div key={scene.id} className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-400 min-w-[60px]">
                    Scene {sceneIndex + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addScene()}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* Layer tracks for this scene */}
                <div className="space-y-1 ml-16">
                  {scene.layers.map((layer) => (
                    <div key={layer.id} className="relative h-10 bg-gray-700/50 rounded">
                      <div className="flex items-center gap-2 p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                        >
                          {layer.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateLayer(layer.id, { muted: !layer.muted })}
                        >
                          {layer.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateLayer(layer.id, { locked: !layer.locked })}
                        >
                          {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </Button>
                        <span className="text-xs text-gray-400 flex-1 truncate">
                          {layer.name || `${layer.type} ${layer.id.slice(-4)}`}
                        </span>
                      </div>
                      
                      {/* Layer block */}
                      <div className="absolute top-0 left-20 right-0 h-full">
                        <LayerBlock
                          layer={layer}
                          sceneIndex={sceneIndex}
                          scale={scale}
                          onSelect={selectLayer}
                          isSelected={selectedLayerId === layer.id}
                          onDrag={handleLayerDrag}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Add layer button */}
                  <div className="h-8 bg-gray-700/30 rounded border-2 border-dashed border-gray-600 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Layer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Layer controls */}
      {selectedLayerId && (
        <div className="border-t border-gray-700 p-2 bg-gray-900">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Layer Controls:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => duplicateLayer(selectedLayerId)}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
            >
              <Scissors className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteLayer(selectedLayerId)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}