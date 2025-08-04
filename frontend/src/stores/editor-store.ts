import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'

export interface Layer {
  id: string
  type: 'video' | 'image' | 'text' | 'audio' | 'shape'
  name: string
  startTime: number
  duration: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  muted?: boolean // For audio/video layers
  data: any // Layer-specific data
}

export interface Scene {
  id: string
  name: string
  duration: number
  layers: Layer[]
  transitions: {
    in?: string
    out?: string
  }
}

export interface Project {
  id: string | null
  name: string
  width: number
  height: number
  frameRate: number
  duration: number
  scenes: Scene[]
  settings: {
    quality: string
    format: string
    backgroundMusic?: string
  }
  createdAt: Date
  updatedAt: Date
}

interface EditorState {
  // Project state
  project: Project | null
  
  // Playback state
  isPlaying: boolean
  currentTime: number
  duration: number
  zoom: number
  
  // Selection state
  selectedLayer: string | null
  selectedScene: string | null
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // History for undo/redo
  history: Project[]
  historyIndex: number
}

interface EditorActions {
  // Project actions
  loadProject: (projectId: string | null) => Promise<void>
  saveProject: (userId: string) => Promise<void>
  createNewProject: () => void
  
  // Playback actions
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setZoom: (zoom: number) => void
  
  // Layer actions
  addLayer: (layer: Omit<Layer, 'id'>) => void
  updateLayer: (layerId: string, updates: Partial<Layer>) => void
  deleteLayer: (layerId: string) => void
  duplicateLayer: (layerId: string) => void
  selectLayer: (layerId: string | null) => void
  moveLayerUp: (layerId: string) => void
  moveLayerDown: (layerId: string) => void
  
  // Scene actions
  addScene: (scene: Omit<Scene, 'id'>) => void
  updateScene: (sceneId: string, updates: Partial<Scene>) => void
  deleteScene: (sceneId: string) => void
  selectScene: (sceneId: string | null) => void
  
  // Export actions
  exportVideo: (options: { quality: string; format: string }) => Promise<void>
  
  // History actions
  undo: () => void
  redo: () => void
  pushToHistory: () => void
  
  // Utility actions
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

type EditorStore = EditorState & EditorActions

const createDefaultProject = (): Project => ({
  id: null,
  name: 'Untitled Project',
  width: 1920,
  height: 1080,
  frameRate: 30,
  duration: 0,
  scenes: [],
  settings: {
    quality: '1080p',
    format: 'mp4'
  },
  createdAt: new Date(),
  updatedAt: new Date()
})

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      project: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      zoom: 1,
      selectedLayer: null,
      selectedScene: null,
      isLoading: false,
      error: null,
      history: [],
      historyIndex: -1,

      // Project actions
      loadProject: async (projectId: string | null) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          if (projectId) {
            // Load existing project from Supabase
            const response = await fetch(`/api/projects/${projectId}`)
            if (!response.ok) throw new Error('Failed to load project')
            
            const project = await response.json()
            set((state) => {
              state.project = project
              state.duration = project.duration
              state.currentTime = 0
              state.isLoading = false
            })
          } else {
            // Create new project
            const newProject = createDefaultProject()
            set((state) => {
              state.project = newProject
              state.duration = 0
              state.currentTime = 0
              state.isLoading = false
            })
          }
          
          get().pushToHistory()
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to load project'
            state.isLoading = false
          })
        }
      },

      saveProject: async (userId: string) => {
        const { project } = get()
        if (!project) return

        set((state) => {
          state.isLoading = true
        })

        try {
          const projectData = {
            ...project,
            updatedAt: new Date()
          }

          const url = project.id ? `/api/projects/${project.id}` : '/api/projects'
          const method = project.id ? 'PUT' : 'POST'

          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...projectData, userId })
          })

          if (!response.ok) throw new Error('Failed to save project')

          const savedProject = await response.json()
          set((state) => {
            state.project = savedProject
            state.isLoading = false
          })
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to save project'
            state.isLoading = false
          })
        }
      },

      createNewProject: () => {
        const newProject = createDefaultProject()
        set((state) => {
          state.project = newProject
          state.duration = 0
          state.currentTime = 0
          state.selectedLayer = null
          state.selectedScene = null
        })
        get().pushToHistory()
      },

      // Playback actions
      play: () => {
        set((state) => {
          state.isPlaying = true
        })
        
        // Start playback timer
        const timer = setInterval(() => {
          const { currentTime, duration, isPlaying } = get()
          if (!isPlaying) {
            clearInterval(timer)
            return
          }
          
          if (currentTime >= duration) {
            get().pause()
            clearInterval(timer)
            return
          }
          
          set((state) => {
            state.currentTime = Math.min(currentTime + 1/30, duration) // 30fps
          })
        }, 1000/30)
      },

      pause: () => {
        set((state) => {
          state.isPlaying = false
        })
      },

      stop: () => {
        set((state) => {
          state.isPlaying = false
          state.currentTime = 0
        })
      },

      seek: (time: number) => {
        set((state) => {
          state.currentTime = Math.max(0, Math.min(time, state.duration))
        })
      },

      setZoom: (zoom: number) => {
        set((state) => {
          state.zoom = Math.max(0.1, Math.min(5, zoom))
        })
      },

      // Layer actions
      addLayer: (layerData) => {
        const layer: Layer = {
          ...layerData,
          id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }

        set((state) => {
          if (!state.project || !state.selectedScene) return
          
          const scene = state.project.scenes.find(s => s.id === state.selectedScene)
          if (scene) {
            scene.layers.push(layer)
            state.selectedLayer = layer.id
          }
        })
        
        get().pushToHistory()
      },

      updateLayer: (layerId: string, updates: Partial<Layer>) => {
        set((state) => {
          if (!state.project) return
          
          for (const scene of state.project.scenes) {
            const layer = scene.layers.find(l => l.id === layerId)
            if (layer) {
              Object.assign(layer, updates)
              break
            }
          }
        })
        
        get().pushToHistory()
      },

      deleteLayer: (layerId: string) => {
        set((state) => {
          if (!state.project) return
          
          for (const scene of state.project.scenes) {
            const index = scene.layers.findIndex(l => l.id === layerId)
            if (index !== -1) {
              scene.layers.splice(index, 1)
              if (state.selectedLayer === layerId) {
                state.selectedLayer = null
              }
              break
            }
          }
        })
        
        get().pushToHistory()
      },

      duplicateLayer: (layerId: string) => {
        set((state) => {
          if (!state.project) return
          
          for (const scene of state.project.scenes) {
            const layer = scene.layers.find(l => l.id === layerId)
            if (layer) {
              const duplicatedLayer: Layer = {
                ...layer,
                id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: `${layer.name} Copy`,
                x: layer.x + 20,
                y: layer.y + 20
              }
              scene.layers.push(duplicatedLayer)
              state.selectedLayer = duplicatedLayer.id
              break
            }
          }
        })
        
        get().pushToHistory()
      },

      selectLayer: (layerId: string | null) => {
        set((state) => {
          state.selectedLayer = layerId
        })
      },

      moveLayerUp: (layerId: string) => {
        set((state) => {
          if (!state.project || !state.selectedScene) return
          
          const scene = state.project.scenes.find(s => s.id === state.selectedScene)
          if (!scene) return
          
          const layerIndex = scene.layers.findIndex(l => l.id === layerId)
          if (layerIndex > 0) {
            const layer = scene.layers[layerIndex]
            scene.layers.splice(layerIndex, 1)
            scene.layers.splice(layerIndex - 1, 0, layer)
          }
        })
        
        get().pushToHistory()
      },

      moveLayerDown: (layerId: string) => {
        set((state) => {
          if (!state.project || !state.selectedScene) return
          
          const scene = state.project.scenes.find(s => s.id === state.selectedScene)
          if (!scene) return
          
          const layerIndex = scene.layers.findIndex(l => l.id === layerId)
          if (layerIndex < scene.layers.length - 1) {
            const layer = scene.layers[layerIndex]
            scene.layers.splice(layerIndex, 1)
            scene.layers.splice(layerIndex + 1, 0, layer)
          }
        })
        
        get().pushToHistory()
      },

      // Scene actions
      addScene: (sceneData) => {
        const scene: Scene = {
          ...sceneData,
          id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }

        set((state) => {
          if (!state.project) return
          
          state.project.scenes.push(scene)
          state.selectedScene = scene.id
          
          // Update total duration
          state.project.duration = state.project.scenes.reduce((total, s) => total + s.duration, 0)
          state.duration = state.project.duration
        })
        
        get().pushToHistory()
      },

      updateScene: (sceneId: string, updates: Partial<Scene>) => {
        set((state) => {
          if (!state.project) return
          
          const scene = state.project.scenes.find(s => s.id === sceneId)
          if (scene) {
            Object.assign(scene, updates)
            
            // Update total duration if scene duration changed
            if ('duration' in updates) {
              state.project.duration = state.project.scenes.reduce((total, s) => total + s.duration, 0)
              state.duration = state.project.duration
            }
          }
        })
        
        get().pushToHistory()
      },

      deleteScene: (sceneId: string) => {
        set((state) => {
          if (!state.project) return
          
          const index = state.project.scenes.findIndex(s => s.id === sceneId)
          if (index !== -1) {
            state.project.scenes.splice(index, 1)
            if (state.selectedScene === sceneId) {
              state.selectedScene = null
            }
            
            // Update total duration
            state.project.duration = state.project.scenes.reduce((total, s) => total + s.duration, 0)
            state.duration = state.project.duration
          }
        })
        
        get().pushToHistory()
      },

      selectScene: (sceneId: string | null) => {
        set((state) => {
          state.selectedScene = sceneId
        })
      },

      // Export actions
      exportVideo: async (options) => {
        const { project } = get()
        if (!project) return

        set((state) => {
          state.isLoading = true
        })

        try {
          const response = await fetch('/api/render', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              project,
              options
            })
          })

          if (!response.ok) throw new Error('Failed to start export')

          const { jobId } = await response.json()
          
          // Poll for job status
          const pollStatus = async () => {
            const statusResponse = await fetch(`/api/render/${jobId}/status`)
            const status = await statusResponse.json()
            
            if (status.status === 'completed') {
              set((state) => {
                state.isLoading = false
              })
              // Handle completion (download link, etc.)
            } else if (status.status === 'failed') {
              throw new Error(status.error || 'Export failed')
            } else {
              // Continue polling
              setTimeout(pollStatus, 2000)
            }
          }
          
          pollStatus()
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Export failed'
            state.isLoading = false
          })
        }
      },

      // History actions
      undo: () => {
        const { history, historyIndex } = get()
        if (historyIndex > 0) {
          set((state) => {
            state.historyIndex = historyIndex - 1
            state.project = JSON.parse(JSON.stringify(history[state.historyIndex]))
          })
        }
      },

      redo: () => {
        const { history, historyIndex } = get()
        if (historyIndex < history.length - 1) {
          set((state) => {
            state.historyIndex = historyIndex + 1
            state.project = JSON.parse(JSON.stringify(history[state.historyIndex]))
          })
        }
      },

      pushToHistory: () => {
        const { project, history, historyIndex } = get()
        if (!project) return

        set((state) => {
          // Remove any history after current index
          state.history = history.slice(0, historyIndex + 1)
          
          // Add current state to history
          state.history.push(JSON.parse(JSON.stringify(project)))
          state.historyIndex = state.history.length - 1
          
          // Limit history size
          if (state.history.length > 50) {
            state.history = state.history.slice(-50)
            state.historyIndex = state.history.length - 1
          }
        })
      },

      // Utility actions
      setError: (error: string | null) => {
        set((state) => {
          state.error = error
        })
      },

      setLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading
        })
      }
    }))
  )
)