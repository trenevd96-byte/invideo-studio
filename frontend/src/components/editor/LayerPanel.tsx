'use client'

import React, { useState, useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Plus,
  Settings,
  Palette,
  Type,
  Image,
  Video,
  Music
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayerPanelProps {
  width?: number
}

interface LayerItemProps {
  layer: any
  isSelected: boolean
  onSelect: (layerId: string) => void
  onToggleVisibility: (layerId: string) => void
  onToggleMute: (layerId: string) => void
  onToggleLock: (layerId: string) => void
  onDelete: (layerId: string) => void
  onDuplicate: (layerId: string) => void
  onMoveUp: (layerId: string) => void
  onMoveDown: (layerId: string) => void
}

function LayerItem({
  layer,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleMute,
  onToggleLock,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown
}: LayerItemProps) {
  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />
      case 'image': return <Image className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'audio': return <Music className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  const getLayerColor = (type: string) => {
    switch (type) {
      case 'text': return 'border-purple-500'
      case 'image': return 'border-orange-500'
      case 'video': return 'border-blue-500'  
      case 'audio': return 'border-green-500'
      default: return 'border-gray-500'
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors',
        isSelected 
          ? 'bg-blue-50 border-blue-500 dark:bg-blue-950 dark:border-blue-400' 
          : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750',
        getLayerColor(layer.type),
        layer.locked && 'opacity-60'
      )}
      onClick={() => onSelect(layer.id)}
    >
      {/* Layer type icon */}
      <div className="flex-shrink-0">
        {getLayerIcon(layer.type)}
      </div>

      {/* Layer name */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {layer.name || `${layer.type} ${layer.id.slice(-4)}`}
        </div>
        <div className="text-xs text-gray-500">
          {layer.startTime?.toFixed(1)}s - {((layer.startTime || 0) + (layer.duration || 0)).toFixed(1)}s
        </div>
      </div>

      {/* Layer controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility(layer.id)
          }}
          className="h-6 w-6 p-0"
        >
          {layer.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </Button>

        {(layer.type === 'video' || layer.type === 'audio') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onToggleMute(layer.id)
            }}
            className="h-6 w-6 p-0"
          >
            {layer.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onToggleLock(layer.id)
          }}
          className="h-6 w-6 p-0"
        >
          {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </Button>

        {/* More actions dropdown */}
        <div className="relative group">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Settings className="w-3 h-3" />
          </Button>
          
          <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <div className="p-1 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveUp(layer.id)
                }}
                className="w-full justify-start h-8"
              >
                <ArrowUp className="w-3 h-3 mr-1" />
                Move Up
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMoveDown(layer.id)
                }}
                className="w-full justify-start h-8"
              >
                <ArrowDown className="w-3 h-3 mr-1" />
                Move Down
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(layer.id)
                }}
                className="w-full justify-start h-8"
              >
                <Copy className="w-3 h-3 mr-1" />
                Duplicate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(layer.id)
                }}
                className="w-full justify-start h-8 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LayerPanel({ width = 300 }: LayerPanelProps) {
  const [activeTab, setActiveTab] = useState('layers')
  
  const {
    project,
    selectedScene,
    selectedLayer,
    selectLayer,
    updateLayer,
    deleteLayer,
    duplicateLayer,
    addLayer,
    moveLayerUp,
    moveLayerDown
  } = useEditorStore()

  // Get current scene and its layers
  const currentScene = project?.scenes.find(s => s.id === selectedScene) || project?.scenes[0]
  const layers = currentScene?.layers || []
  
  const selectedLayerData = layers.find(layer => layer.id === selectedLayer)

  // Layer management handlers
  const handleToggleVisibility = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    updateLayer(layerId, { visible: !(layer?.visible !== false) })
  }, [layers, updateLayer])

  const handleToggleMute = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    updateLayer(layerId, { muted: !layer?.muted })
  }, [layers, updateLayer])

  const handleToggleLock = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    updateLayer(layerId, { locked: !layer?.locked })
  }, [layers, updateLayer])

  // Add new layer handlers
  const handleAddTextLayer = useCallback(() => {
    addLayer({
      type: 'text',
      name: 'New Text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      startTime: 0,
      duration: 5,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      data: {
        content: 'New Text',
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        textAlign: 'left'
      }
    })
  }, [addLayer])

  const handleAddImageLayer = useCallback(() => {
    // This would typically open a file picker
    addLayer({
      type: 'image',
      name: 'New Image',
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      startTime: 0,
      duration: 5,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      data: {
        source: '' // URL would be set after upload
      }
    })
  }, [addLayer])

  const handleAddVideoLayer = useCallback(() => {
    // This would typically open a file picker
    addLayer({
      type: 'video',
      name: 'New Video',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      startTime: 0,
      duration: 10,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      data: {
        source: '' // URL would be set after upload
      }
    })
  }, [addLayer])

  const handleAddAudioLayer = useCallback(() => {
    // This would typically open a file picker
    addLayer({
      type: 'audio',
      name: 'New Audio',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      startTime: 0,
      duration: 10,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      data: {
        source: '' // URL would be set after upload
      }
    })
  }, [addLayer])

  return (
    <div className="bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700" style={{ width }}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-2">
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="flex-1 flex flex-col p-2 space-y-2">
          {/* Add layer buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTextLayer}
              className="flex items-center gap-1"
            >
              <Type className="w-3 h-3" />
              Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddImageLayer}
              className="flex items-center gap-1"
            >
              <Image className="w-3 h-3" />
              Image
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddVideoLayer}
              className="flex items-center gap-1"
            >
              <Video className="w-3 h-3" />
              Video
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAudioLayer}
              className="flex items-center gap-1"
            >
              <Music className="w-3 h-3" />
              Audio
            </Button>
          </div>

          {/* Layer list */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {layers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No layers yet</p>
                  <p className="text-xs">Add layers using the buttons above</p>
                </div>
              ) : (
                layers.map((layer) => (
                  <LayerItem
                    key={layer.id}
                    layer={layer}
                    isSelected={selectedLayer === layer.id}
                    onSelect={selectLayer}
                    onToggleVisibility={handleToggleVisibility}
                    onToggleMute={handleToggleMute}
                    onToggleLock={handleToggleLock}
                    onDelete={deleteLayer}
                    onDuplicate={duplicateLayer}
                    onMoveUp={moveLayerUp}
                    onMoveDown={moveLayerDown}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="properties" className="flex-1 p-2">
          {selectedLayerData ? (
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Layer Properties</h3>
                  <div className="text-sm text-gray-500 mb-4">
                    {selectedLayerData.type} • {selectedLayerData.id.slice(-8)}
                  </div>
                </div>

                {/* Basic properties */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="layer-name">Name</Label>
                    <Input
                      id="layer-name"
                      value={selectedLayerData.name || ''}
                      onChange={(e) => updateLayer(selectedLayerData.id, { name: e.target.value })}
                      placeholder="Layer name"
                    />
                  </div>

                  {/* Position and size */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="layer-x">X</Label>
                      <Input
                        id="layer-x"
                        type="number"
                        value={selectedLayerData.x || 0}
                        onChange={(e) => updateLayer(selectedLayerData.id, { x: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="layer-y">Y</Label>
                      <Input
                        id="layer-y"
                        type="number"
                        value={selectedLayerData.y || 0}
                        onChange={(e) => updateLayer(selectedLayerData.id, { y: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="layer-width">Width</Label>
                      <Input
                        id="layer-width"
                        type="number"
                        value={selectedLayerData.width || 0}
                        onChange={(e) => updateLayer(selectedLayerData.id, { width: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="layer-height">Height</Label>
                      <Input
                        id="layer-height"
                        type="number"
                        value={selectedLayerData.height || 0}
                        onChange={(e) => updateLayer(selectedLayerData.id, { height: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Timing */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="layer-start">Start (s)</Label>
                      <Input
                        id="layer-start"
                        type="number"
                        step="0.1"
                        value={selectedLayerData.startTime || 0}
                        onChange={(e) => updateLayer(selectedLayerData.id, { startTime: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="layer-duration">Duration (s)</Label>
                      <Input
                        id="layer-duration"
                        type="number"
                        step="0.1"
                        value={selectedLayerData.duration || 0}
                        onChange={(e) => updateLayer(selectedLayerData.id, { duration: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Opacity */}
                  <div>
                    <Label htmlFor="layer-opacity">Opacity</Label>
                    <Slider
                      id="layer-opacity"
                      min={0}
                      max={1}
                      step={0.01}
                      value={[selectedLayerData.opacity || 1]}
                      onValueChange={([value]) => updateLayer(selectedLayerData.id, { opacity: value })}
                      className="mt-2"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round((selectedLayerData.opacity || 1) * 100)}%
                    </div>
                  </div>

                  {/* Text-specific properties */}
                  {selectedLayerData.type === 'text' && (
                    <>
                      <div>
                        <Label htmlFor="layer-content">Text Content</Label>
                        <Input
                          id="layer-content"
                          value={selectedLayerData.data?.content || ''}
                          onChange={(e) => updateLayer(selectedLayerData.id, { 
                            data: { ...selectedLayerData.data, content: e.target.value }
                          })}
                          placeholder="Enter text"
                        />
                      </div>

                      <div>
                        <Label htmlFor="layer-font-size">Font Size</Label>
                        <Input
                          id="layer-font-size"
                          type="number"
                          value={selectedLayerData.data?.fontSize || 24}
                          onChange={(e) => updateLayer(selectedLayerData.id, { 
                            data: { ...selectedLayerData.data, fontSize: parseFloat(e.target.value) }
                          })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="layer-color">Text Color</Label>
                        <Input
                          id="layer-color"
                          type="color"
                          value={selectedLayerData.data?.color || '#000000'}
                          onChange={(e) => updateLayer(selectedLayerData.id, { 
                            data: { ...selectedLayerData.data, color: e.target.value }
                          })}
                        />
                      </div>
                    </>
                  )}

                  {/* Image/Video specific properties */}
                  {(selectedLayerData.type === 'image' || selectedLayerData.type === 'video') && (
                    <div>
                      <Label htmlFor="layer-source">Source URL</Label>
                      <Input
                        id="layer-source"
                        value={selectedLayerData.data?.source || ''}
                        onChange={(e) => updateLayer(selectedLayerData.id, { 
                          data: { ...selectedLayerData.data, source: e.target.value }
                        })}
                        placeholder="Enter URL"
                      />
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No layer selected</p>
              <p className="text-xs">Select a layer to edit its properties</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}