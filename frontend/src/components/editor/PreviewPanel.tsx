'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Square, Volume2, VolumeX, Maximize } from 'lucide-react'

interface PreviewPanelProps {
  width?: number
  height?: number
}

export function PreviewPanel({ width = 400, height = 300 }: PreviewPanelProps) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ width, height }}>
      {/* Preview Area */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-white/50 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8" />
          </div>
          <p>Preview Panel</p>
          <p className="text-sm">Video preview will appear here</p>
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between bg-black/50 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}