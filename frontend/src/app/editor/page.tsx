'use client'

export default function EditorPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <h1 className="text-xl font-semibold">InVideo Studio Editor</h1>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Export Video
          </button>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            🎬 InVideo Studio Editor
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Professional video editing with AI-powered tools
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-2">🎨</div>
              <h3 className="font-semibold mb-2">Canvas Editor</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag-and-drop editing with Konva.js
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-2">⏱️</div>
              <h3 className="font-semibold mb-2">Timeline</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Multi-layer timeline with precision controls
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="font-semibold mb-2">AI Assistant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Script generation and storyboarding
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-2">🎭</div>
              <h3 className="font-semibold mb-2">Assets</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stock videos, images, and audio
              </p>
            </div>
          </div>
          <div className="mt-8">
            <p className="text-sm text-gray-500">
              🚀 Generated with <a href="https://claude.ai/code" className="text-blue-600 hover:underline">Claude Code</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}