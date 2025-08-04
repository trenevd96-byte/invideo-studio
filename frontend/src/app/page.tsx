'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Create Viral Videos
              <br />
              <span className="text-4xl md:text-6xl">with AI Power</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Professional video creation platform that transforms your ideas into engaging content 
              using AI-powered templates, smart editing, and automated workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/editor">
                <button className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-4 rounded-lg font-semibold transition-colors">
                  🎬 Open Studio
                </button>
              </Link>
              <Link href="/templates">
                <button className="border-white border text-white hover:bg-white/10 text-lg px-8 py-4 rounded-lg font-semibold transition-colors">
                  Browse Templates →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Create Amazing Videos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From AI-powered script generation to professional rendering, 
              our platform handles the technical complexity so you can focus on creativity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Script Generation</h3>
              <p className="text-gray-600">
                Transform your ideas into professional scripts with GPT-4 powered content generation
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Drag & Drop Editor</h3>
              <p className="text-gray-600">
                Intuitive timeline editor with real-time preview and professional-grade controls
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Avatars & Voices</h3>
              <p className="text-gray-600">
                Create engaging presentations with AI-generated avatars and natural voice synthesis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Preview */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Templates for Every Use Case
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from hundreds of professionally designed templates or create your own
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              { name: 'Business Presentation', category: 'Business' },
              { name: 'Educational Tutorial', category: 'Education' },
              { name: 'Social Media Promo', category: 'Marketing' },
            ].map((template) => (
              <div key={template.name} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <span className="text-6xl">🎬</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-gray-600">{template.category}</p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/templates">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                View All Templates →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Create Your First Video?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of creators who are already using our platform to create engaging content
          </p>
          <Link href="/editor">
            <button className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-lg font-semibold transition-colors">
              ✨ Start Creating Now
            </button>
          </Link>
          <div className="mt-8">
            <p className="text-sm opacity-75">
              🚀 Generated with <a href="https://claude.ai/code" className="underline hover:no-underline">Claude Code</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}