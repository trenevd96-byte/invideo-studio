# 🎬 InVideo-Style UGC Influencer Studio MVP

A production-ready video creation platform integrated with AI Micro-Influencer Factory SaaS.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repo-url>
cd invideo-studio

# Environment setup
cp .env.example .env
# Fill in your API keys (OpenAI, ElevenLabs, Stripe, Supabase)

# Start development
docker-compose up -d
npm run dev

# Deploy to production
git push origin main  # Auto-deploys via GitHub Actions
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Render Queue  │
│   (React/Konva) │◄──►│   (Express)     │◄──►│   (FFmpeg)      │
│   Vercel        │    │   Railway       │    │   BullMQ/Redis  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   AI Services   │    │   Asset CDN     │
│   Auth/Storage  │    │   GPT-4/Whisper │    │   Pixabay/Pexels│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
invideo-studio/
├── frontend/                 # React + Konva.js editor
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/      # Canvas, Timeline, Layers
│   │   │   ├── templates/   # Template gallery
│   │   │   └── ui/          # Shared components
│   │   ├── stores/          # Zustand state management  
│   │   ├── services/        # API clients
│   │   └── types/           # TypeScript definitions
│   ├── Dockerfile
│   └── package.json
├── backend/                  # Express + AI + FFmpeg
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # AI, Render, Asset services
│   │   ├── jobs/            # Background job processors
│   │   └── middleware/      # Auth, validation, etc.
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml        # Local development
├── .github/workflows/        # CI/CD pipelines
└── docs/                     # API documentation
```

## 🔑 Environment Variables

Required API keys (add to `.env`):
- `OPENAI_API_KEY`: GPT-4 script generation
- `ELEVENLABS_API_KEY`: Voice synthesis
- `SUPABASE_URL` + `SUPABASE_ANON_KEY`: Database & auth
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`: Billing
- `PIXABAY_API_KEY`: Stock assets
- `REDIS_URL`: Background jobs

## 🎯 Features

### Editor
- Drag-drop Konva.js canvas with multi-layer composition
- Timeline scrubber with scene management
- Real-time preview playback
- Asset library integration

### AI Pipeline  
- GPT-4 script → JSON storyboard generation
- ElevenLabs TTS for voiceovers
- Whisper for auto-subtitles
- CLIP for smart asset matching

### Rendering
- FFmpeg-powered MP4 generation
- BullMQ job queue with progress tracking
- Multiple quality outputs (720p, 1080p, 4K)

### Templates
- JSON-based template system
- Dynamic placeholder replacement
- Professional template library

## 🚀 Deployment

- **Frontend**: Auto-deployed to Vercel via GitHub Actions
- **Backend**: Auto-deployed to Railway via GitHub Actions  
- **Database**: Supabase (managed PostgreSQL)
- **Queue**: Redis (Railway addon)

## 📊 Database Schema

```sql
-- Core tables
users (id, email, subscription_tier, created_at)
projects (id, user_id, name, json_data, status, created_at)
render_jobs (id, project_id, status, progress, output_url, created_at)
assets (id, user_id, filename, url, metadata, created_at)
templates (id, name, category, json_schema, preview_url, created_at)
```

## 🔧 Development

```bash
# Frontend development
cd frontend
npm run dev        # http://localhost:3000

# Backend development  
cd backend
npm run dev        # http://localhost:8000

# Full stack with Docker
docker-compose up -d
```

## 📝 API Endpoints

```
POST /api/ai/script          # Generate storyboard from text
POST /api/render             # Start video render job
GET  /api/render/:id/status  # Check render progress
GET  /api/templates          # List available templates
POST /api/assets/upload      # Upload custom assets
GET  /health                 # Health check
```

## 🧪 Testing

```bash
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run lint           # Code linting
npm run type-check     # TypeScript validation
```

Built with ❤️ for professional UGC creators