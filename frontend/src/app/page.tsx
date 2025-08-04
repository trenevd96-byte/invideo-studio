'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Zap, Users, Sparkles, ArrowRight, Check } from 'lucide-react'
import { useSession } from '@supabase/auth-helpers-react'

export default function HomePage() {
  const session = useSession()

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
              {session ? (
                <Link href="/editor">
                  <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-4">
                    <Play className="mr-2 h-5 w-5" />
                    Open Studio
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-4">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Creating Free
                  </Button>
                </Link>
              )}
              <Link href="/templates">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                  Browse Templates
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
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
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>AI Script Generation</CardTitle>
                <CardDescription>
                  Transform your ideas into professional scripts with GPT-4 powered content generation
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Play className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Drag & Drop Editor</CardTitle>
                <CardDescription>
                  Intuitive timeline editor with real-time preview and professional-grade controls
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>AI Avatars & Voices</CardTitle>
                <CardDescription>
                  Create engaging presentations with AI-generated avatars and natural voice synthesis
                </CardDescription>
              </CardHeader>
            </Card>
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
              { name: 'Business Presentation', category: 'Business', image: '/templates/business.jpg' },
              { name: 'Educational Tutorial', category: 'Education', image: '/templates/education.jpg' },
              { name: 'Social Media Promo', category: 'Marketing', image: '/templates/social.jpg' },
            ].map((template) => (
              <Card key={template.name} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Play className="h-16 w-16 text-blue-600" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-gray-600">{template.category}</p>
                    </div>
                    <Button size="sm">Use Template</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link href="/templates">
              <Button size="lg">
                View All Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free and scale as you grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Free',
                price: '$0',
                description: 'Perfect for getting started',
                features: ['3 videos per month', 'Basic templates', '720p exports', 'Community support']
              },
              {
                name: 'Pro',
                price: '$29',
                description: 'For serious creators',
                features: ['Unlimited videos', 'Premium templates', '4K exports', 'AI voice synthesis', 'Priority support'],
                popular: true
              },
              {
                name: 'Enterprise',
                price: '$99',
                description: 'For teams and agencies',
                features: ['Everything in Pro', 'Custom branding', 'API access', 'Dedicated support', 'Advanced analytics']
              }
            ].map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-lg font-normal text-gray-600">/month</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
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
          <Link href={session ? "/editor" : "/auth/signup"}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4">
              <Sparkles className="mr-2 h-5 w-5" />
              {session ? "Open Studio" : "Start Creating Now"}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}