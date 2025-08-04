'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Image, 
  Video, 
  Music, 
  Upload, 
  Download,
  Heart,
  Play,
  Pause,
  Volume2,
  Eye,
  Filter,
  Grid3X3,
  List,
  Clock,
  User,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores/editor-store'

interface Asset {
  id: string
  type: 'image' | 'video' | 'audio'
  title: string
  url: string
  thumbnail?: string
  duration?: number
  size?: string
  author?: string
  tags?: string[]
  license?: string
  provider: 'pixabay' | 'pexels' | 'unsplash' | 'user'
  isLiked?: boolean
}

interface AssetLibraryProps {
  width?: number
}

interface AssetCardProps {
  asset: Asset
  view: 'grid' | 'list'
  onSelect: (asset: Asset) => void
  onPreview: (asset: Asset) => void
  onLike: (assetId: string) => void
  isSelected?: boolean
}

function AssetCard({ asset, view, onSelect, onPreview, onLike, isSelected }: AssetCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handlePreview = useCallback(() => {
    if (asset.type === 'video' || asset.type === 'audio') {
      setIsPlaying(!isPlaying)
    }
    onPreview(asset)
  }, [asset, isPlaying, onPreview])

  const handleSelect = useCallback(() => {
    setIsLoading(true)
    onSelect(asset)
    setTimeout(() => setIsLoading(false), 1000) // Simulate loading
  }, [asset, onSelect])

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (view === 'list') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
          isSelected 
            ? 'bg-blue-50 border-blue-500 dark:bg-blue-950 dark:border-blue-400'
            : 'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750'
        )}
        onClick={handleSelect}
      >
        {/* Thumbnail */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <img
            src={asset.thumbnail || asset.url}
            alt={asset.title}
            className="w-full h-full object-cover rounded"
          />
          {asset.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
              <Play className="w-4 h-4 text-white" />
            </div>
          )}
          {asset.type === 'audio' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
              <Volume2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{asset.title}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            {asset.author && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {asset.author}
              </span>
            )}
            {asset.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(asset.duration)}
              </span>
            )}
            {asset.size && <span>{asset.size}</span>}
          </div>
          {asset.tags && asset.tags.length > 0 && (
            <div className="flex gap-1 mt-1">
              {asset.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handlePreview()
            }}
            className="h-8 w-8 p-0"
          >
            <Eye className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onLike(asset.id)
            }}
            className={cn('h-8 w-8 p-0', asset.isLiked && 'text-red-500')}
          >
            <Heart className={cn('w-3 h-3', asset.isLiked && 'fill-current')} />
          </Button>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105',
        isSelected && 'ring-2 ring-blue-500'
      )}
      onClick={handleSelect}
    >
      {/* Image/Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={asset.thumbnail || asset.url}
          alt={asset.title}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {asset.type === 'video' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreview()
                }}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            )}
            {asset.type === 'audio' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreview()
                }}
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            )}
            {asset.type === 'image' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreview()
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Duration badge */}
        {asset.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(asset.duration)}
          </div>
        )}

        {/* Like button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onLike(asset.id)
          }}
          className={cn(
            'absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
            asset.isLiked && 'opacity-100 text-red-500'
          )}
        >
          <Heart className={cn('w-4 h-4', asset.isLiked && 'fill-current')} />
        </Button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="font-medium text-sm truncate mb-1">{asset.title}</h4>
        <div className="flex items-center justify-between text-xs text-gray-500">
          {asset.author && (
            <span className="flex items-center gap-1 truncate">
              <User className="w-3 h-3" />
              {asset.author}
            </span>
          )}
          {asset.provider && (
            <Badge variant="outline" className="text-xs">
              {asset.provider}
            </Badge>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}
    </div>
  )
}

export function AssetLibrary({ width = 400 }: AssetLibraryProps) {
  const [activeTab, setActiveTab] = useState('images')
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  const { addLayer } = useEditorStore()

  // Mock assets data
  const mockAssets: Asset[] = [
    {
      id: '1',
      type: 'image',
      title: 'Modern Office Space',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c',
      author: 'John Doe',
      tags: ['office', 'modern', 'workspace'],
      provider: 'unsplash'
    },
    {
      id: '2',
      type: 'video',
      title: 'Time Lapse City',
      url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000',
      duration: 30,
      author: 'Jane Smith',
      tags: ['city', 'timelapse', 'urban'],
      provider: 'pexels'
    },
    {
      id: '3',
      type: 'audio',
      title: 'Upbeat Background Music',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
      duration: 120,
      author: 'Audio Pro',
      tags: ['music', 'upbeat', 'background'],
      provider: 'pixabay'
    }
  ]

  // Load assets based on active tab and search
  useEffect(() => {
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      let filteredAssets = mockAssets.filter(asset => {
        const matchesType = activeTab === 'all' || 
          (activeTab === 'images' && asset.type === 'image') ||
          (activeTab === 'videos' && asset.type === 'video') ||
          (activeTab === 'audio' && asset.type === 'audio')
        
        const matchesSearch = !searchQuery || 
          asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        
        return matchesType && matchesSearch
      })
      
      setAssets(filteredAssets)
      setLoading(false)
    }, 500)
  }, [activeTab, searchQuery])

  const handleAssetSelect = useCallback((asset: Asset) => {
    setSelectedAsset(asset)
    
    // Add asset as a layer with all required properties
    const baseLayerData = {
      type: asset.type,
      name: asset.title,
      x: 100,
      y: 100,
      startTime: 0,
      duration: asset.duration || (asset.type === 'image' ? 5 : 10),
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      data: {
        source: asset.url,
        originalAsset: asset
      }
    }

    if (asset.type === 'image') {
      addLayer({
        ...baseLayerData,
        width: 400,
        height: 300
      })
    } else if (asset.type === 'video') {
      addLayer({
        ...baseLayerData,
        width: 1920,
        height: 1080
      })
    } else if (asset.type === 'audio') {
      addLayer({
        ...baseLayerData,
        width: 0,
        height: 0
      })
    }
  }, [addLayer])

  const handleAssetPreview = useCallback((asset: Asset) => {
    // This would open a preview modal
    console.log('Preview asset:', asset)
  }, [])

  const handleAssetLike = useCallback((assetId: string) => {
    setAssets(prev => prev.map(asset => 
      asset.id === assetId 
        ? { ...asset, isLiked: !asset.isLiked }
        : asset
    ))
  }, [])

  const handleUpload = useCallback(() => {
    // This would open a file upload dialog
    console.log('Upload asset')
  }, [])

  return (
    <div className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700" style={{ width }}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Asset Library</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="h-8 w-8 p-0"
            >
              {view === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpload}
              className="h-8 w-8 p-0"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 m-2">
          <TabsTrigger value="images" className="flex items-center gap-1">
            <Image className="w-3 h-3" />
            Images
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-1">
            <Video className="w-3 h-3" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  {activeTab === 'images' ? <Image className="w-8 h-8 text-gray-400" /> :
                   activeTab === 'videos' ? <Video className="w-8 h-8 text-gray-400" /> :
                   activeTab === 'audio' ? <Music className="w-8 h-8 text-gray-400" /> :
                   <Search className="w-8 h-8 text-gray-400" />}
                </div>
                <p className="text-gray-500 text-sm">
                  {searchQuery ? 'No assets found for your search' : 'No assets available'}
                </p>
                {!searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpload}
                    className="mt-2"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload Assets
                  </Button>
                )}
              </div>
            ) : (
              <div className={cn(
                'gap-3',
                view === 'grid' 
                  ? 'grid grid-cols-2' 
                  : 'space-y-2'
              )}>
                {assets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    view={view}
                    onSelect={handleAssetSelect}
                    onPreview={handleAssetPreview}
                    onLike={handleAssetLike}
                    isSelected={selectedAsset?.id === asset.id}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  )
}