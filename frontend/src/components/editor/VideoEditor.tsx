'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Konva components to avoid SSR issues
const Stage = dynamic(() => import('react-konva').then(mod => ({ default: mod.Stage })), { ssr: false })
const Layer = dynamic(() => import('react-konva').then(mod => ({ default: mod.Layer })), { ssr: false })
const Rect = dynamic(() => import('react-konva').then(mod => ({ default: mod.Rect })), { ssr: false })
const Text = dynamic(() => import('react-konva').then(mod => ({ default: mod.Text })), { ssr: false })
const KonvaImage = dynamic(() => import('react-konva').then(mod => ({ default: mod.Image })), { ssr: false })
const Group = dynamic(() => import('react-konva').then(mod => ({ default: mod.Group })), { ssr: false })
import { useEditorStore } from '@/stores/editor-store'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface VideoEditorProps {
  width?: number
  height?: number
}

export function VideoEditor({ width = 800, height = 450 }: VideoEditorProps) {
  const stageRef = useRef<any>(null)
  const [stageScale, setStageScale] = useState(1)
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Ensure client-side rendering for Konva
  useEffect(() => {
    setIsClient(true)
  }, [])

  const {
    project,
    isPlaying,
    currentTime,
    play,
    pause,
    stop,
    seek,
    updateLayer,
    deleteLayer,
    addLayer,
    selectLayer,
    selectedLayer
  } = useEditorStore()

  // Get current scene and selected layer ID
  const currentScene = project?.scenes.find(s => s.id === useEditorStore.getState().selectedScene) || project?.scenes[0]
  const selectedLayerId = selectedLayer

  // Canvas dimensions based on project settings
  const canvasWidth = project?.width || 1920
  const canvasHeight = project?.height || 1080

  // Handle layer selection
  const handleStageMouseDown = useCallback((e: any) => {
    // Clicked on stage - check if we clicked on an empty area
    if (e.target === e.target.getStage()) {
      setSelectedId(null)
      selectLayer(null)
      return
    }

    // Find the layer that was clicked
    const clickedOnLayer = e.target.findAncestor('.layer-group')
    if (clickedOnLayer) {
      const layerId = clickedOnLayer.id()
      setSelectedId(layerId)
      selectLayer(layerId)
    }
  }, [selectLayer])

  // Handle drag end for layers
  const handleDragEnd = useCallback((layerId: string, newAttrs: any) => {
    updateLayer(layerId, {
      x: newAttrs.x,
      y: newAttrs.y
    })
  }, [updateLayer])

  // Handle transform end for layers
  const handleTransformEnd = useCallback((layerId: string, node: any) => {
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    
    // Reset scale and update dimensions
    node.scaleX(1)
    node.scaleY(1)
    
    updateLayer(layerId, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation()
    })
  }, [updateLayer])

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(stageScale * 1.2, 3)
    setStageScale(newScale)
  }, [stageScale])

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(stageScale / 1.2, 0.1)
    setStageScale(newScale)
  }, [stageScale])

  const handleResetView = useCallback(() => {
    setStageScale(1)
    setStagePosition({ x: 0, y: 0 })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (isPlaying) {
          pause()
        } else {
          play()
        }
      } else if (e.code === 'Delete' && selectedLayerId) {
        deleteLayer(selectedLayerId)
        setSelectedId(null)
      } else if (e.code === 'Escape') {
        setSelectedId(null)
        selectLayer(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, selectedLayerId, play, pause, deleteLayer, selectLayer])

  // Render layer based on type
  const renderLayer = useCallback((layer: any) => {
    const commonProps = {
      id: layer.id,
      x: layer.x || 0,
      y: layer.y || 0,
      width: layer.width || 100,
      height: layer.height || 100,
      rotation: layer.rotation || 0,
      opacity: layer.opacity || 1,
      draggable: true,
      onDragEnd: (e: any) => {
        handleDragEnd(layer.id, e.target.attrs)
      },
      onTransformEnd: (e: any) => {
        handleTransformEnd(layer.id, e.target)
      }
    }

    switch (layer.type) {
      case 'text':
        return (
          <Text
            key={layer.id}
            {...commonProps}
            text={layer.content || 'Text Layer'}
            fontSize={layer.fontSize || 24}
            fontFamily={layer.fontFamily || 'Arial'}
            fill={layer.color || '#000000'}
            align={layer.textAlign || 'left'}
            verticalAlign={layer.verticalAlign || 'top'}
            wrap="word"
          />
        )
      
      case 'rectangle':
        return (
          <Rect
            key={layer.id}
            {...commonProps}
            fill={layer.backgroundColor || '#ff0000'}
            stroke={layer.borderColor || '#000000'}
            strokeWidth={layer.borderWidth || 0}
            cornerRadius={layer.borderRadius || 0}
          />
        )
      
      case 'image':
        return (
          <KonvaImage
            key={layer.id}
            {...commonProps}
            image={layer.imageElement}
          />
        )
      
      case 'video':
        // Video layers would be handled differently - placeholder for now
        return (
          <Rect
            key={layer.id}
            {...commonProps}
            fill="#333333"
            stroke="#666666"
            strokeWidth={2}
            cornerRadius={4}
          />
        )
      
      default:
        return null
    }
  }, [handleDragEnd, handleTransformEnd])

  // Get current scene layers
  const currentSceneLayers = currentScene?.layers || []
  const visibleLayers = currentSceneLayers.filter(layer => {
    const startTime = layer.startTime || 0
    const duration = layer.duration || 10
    return currentTime >= startTime && currentTime <= startTime + duration
  })

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={isPlaying ? pause : play}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={stop}
        >
          <Square className="w-4 h-4" />
        </Button>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="px-2 py-1 bg-black/50 text-white text-sm rounded">
          {Math.round(stageScale * 100)}%
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetView}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex justify-center items-center" style={{ width, height }}>
        {isClient && <Stage
          ref={stageRef}
          width={width}
          height={height}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          onMouseDown={handleStageMouseDown}
          draggable
          onDragEnd={(e) => {
            setStagePosition({
              x: e.target.x(),
              y: e.target.y()
            })
          }}
        >
          <Layer>
            {/* Canvas background */}
            <Rect
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill="#ffffff"
              stroke="#ddd"
              strokeWidth={1}
            />
            
            {/* Render all visible layers */}
            {visibleLayers.map(layer => (
              <Group
                key={layer.id}
                name="layer-group"
                id={layer.id}
              >
                {renderLayer(layer)}
              </Group>
            ))}
          </Layer>
        </Stage>}
      </div>

      {/* Timeline scrubber */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-black/50 rounded p-2">
          <div className="flex items-center gap-2 text-white text-sm">
            <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min={0}
                max={project?.duration || 60}
                step={0.1}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div 
                className="absolute top-0 left-0 h-2 bg-blue-500 rounded-lg pointer-events-none"
                style={{ width: `${(currentTime / (project?.duration || 60)) * 100}%` }}
              />
            </div>
            <span>{Math.floor((project?.duration || 60) / 60)}:{((project?.duration || 60) % 60).toFixed(1).padStart(4, '0')}</span>
          </div>
        </div>
      </div>

      {/* Layer info panel */}
      {selectedLayerId && (
        <div className="absolute bottom-20 right-4 z-10 bg-black/80 text-white p-3 rounded-lg min-w-[200px]">
          <h4 className="font-semibold mb-2">Layer Properties</h4>
          <div className="space-y-1 text-sm">
            <div>ID: {selectedLayerId}</div>
            <div>Type: {currentSceneLayers.find(l => l.id === selectedLayerId)?.type}</div>
            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  deleteLayer(selectedLayerId)
                  setSelectedId(null)
                }}
              >
                Delete Layer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}