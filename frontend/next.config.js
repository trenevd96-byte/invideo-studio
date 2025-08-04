/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['konva', 'canvas']
  },
  images: {
    domains: [
      'cdn.pixabay.com',
      'images.pexels.com',
      'images.unsplash.com',
      'supabase.co',
      'localhost'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**'
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com'
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com'
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com'
      }
    ]
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { isServer }) => {
    // Handle canvas module for server-side rendering
    if (isServer) {
      config.externals.push('canvas')
      config.externals.push('konva/lib/index-node')
    }
    
    // Handle konva with canvas
    config.externals = config.externals || []
    config.externals.push({
      canvas: 'canvas',
      'konva/lib/index-node': 'konva/lib/index-node'
    })

    // Resolve canvas module issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false
    }

    return config
  }
}

module.exports = nextConfig