# 🎙️ Audio-Based TTS Podcast Feature

Complete implementation of real audio-based podcast generation using Edge-TTS, replacing the old Web Speech API.

---

## 🚀 Quick Start (Under 5 Minutes)

### 1. Run Setup Script
```bash
cd server
node test-db-setup.js
```

This will:
- ✅ Check your Supabase connection
- ✅ Verify you're using the service_role key
- ✅ Test if the podcasts table exists
- ✅ Guide you through any missing setup

### 2. Fix Any Issues
The script will tell you exactly what to do. Most common:

**If table doesn't exist:**
- Go to Supabase Dashboard → SQL Editor
- Copy from `server/migrations/001_create_podcasts_table_final.sql`
- Paste and run

**If using wrong key:**
- Get service_role key from Supabase Dashboard → Settings → API
- Update `server/.env` with `SUPABASE_SERVICE_ROLE_KEY=...`

### 3. Install Edge-TTS
```bash
cd server
pip3 install edge-tts
```

### 4. Start Everything
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

### 5. Test It
1. Go to http://localhost:3000/assistant/files
2. Upload a PDF
3. Extract text
4. Generate podcast
5. ✅ Play!

---

## 📖 Documentation Index

### Getting Started
- **[PODCAST_QUICKSTART.md](PODCAST_QUICKSTART.md)** ⭐ - Start here! 5-minute setup
- **[PODCAST_SETUP_GUIDE.md](PODCAST_SETUP_GUIDE.md)** - Complete setup guide with all details

### Troubleshooting
- **[PODCAST_ERRORS_QUICK_FIX.md](PODCAST_ERRORS_QUICK_FIX.md)** ⭐ - Quick fixes for all errors
- **[FIX_DATABASE_ERROR.md](FIX_DATABASE_ERROR.md)** - "char_count column not found"
- **[FIX_PERMISSION_ERROR.md](FIX_PERMISSION_ERROR.md)** - "permission denied for schema"
- **[PODCAST_TROUBLESHOOTING.md](PODCAST_TROUBLESHOOTING.md)** - Comprehensive debugging guide

### Technical Reference
- **[PODCAST_IMPLEMENTATION_SUMMARY.md](PODCAST_IMPLEMENTATION_SUMMARY.md)** - Architecture & design
- **[PODCAST_API_MIGRATION.md](PODCAST_API_MIGRATION.md)** - API changes & migration guide

---

## ⚡ Common Issues → Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| **"char_count column not found"** | Run migration: Copy SQL from `server/migrations/` to Supabase |
| **"permission denied"** | Use service_role key in `server/.env` (not anon) |
| **"404 Not Found"** | Start backend: `cd server && npm run dev` |
| **"edge-tts not found"** | Install: `pip3 install edge-tts` |
| **"Bucket not found"** | Create `podcasts` bucket in Supabase Storage |
| **Stuck in "pending"** | Check server logs, verify Edge-TTS installed |

**For any error, run:** `cd server && node test-db-setup.js`

---

## 🎯 What This Feature Does

### User Flow
1. User uploads PDF → Text extracted
2. User clicks "Generate Podcast" → Backend creates record (status: pending)
3. Background: Edge-TTS generates real MP3 file
4. Background: Uploads to Supabase Storage
5. Background: Extracts duration from audio metadata
6. Status changes to "ready" → User can play

### Key Features
- ✅ **Real audio files** (MP3, not Web Speech API)
- ✅ **Free forever** (Edge-TTS, no API costs)
- ✅ **Smart limits** (Auto-reduces text >1500 words with Claude)
- ✅ **Native controls** (Seeking, speed, volume all work)
- ✅ **Persistent storage** (Audio stored in Supabase)
- ✅ **State management** (pending/ready/failed)
- ✅ **One-time generation** (Cached by content hash)

---

## 🏗️ Architecture

```
Frontend (Next.js)
    ↓
Next.js API Routes (proxy)
    ↓
Express Backend (Node.js)
    ↓
┌─────────────────┐
│ Text Validation │ → Enforces 8K char / 1500 word limits
│ & Reduction     │ → Auto-reduces with Claude if needed
└─────────────────┘
    ↓
┌─────────────────┐
│ Edge-TTS        │ → Generates real MP3 audio
│ (Microsoft TTS) │ → 100% free, high quality
└─────────────────┘
    ↓
┌─────────────────┐
│ Supabase        │ → Stores audio files
│ Storage         │ → Provides public URLs
└─────────────────┘
    ↓
┌─────────────────┐
│ Database        │ → Tracks state (pending/ready/failed)
│ (PostgreSQL)    │ → Stores metadata & duration
└─────────────────┘
    ↓
Frontend receives audio_url
    ↓
Native <audio> element plays real MP3
```

---

## 📁 File Structure

### Server (Backend)
```
server/
├── migrations/
│   └── 001_create_podcasts_table_final.sql  ← Database schema
├── services/
│   ├── podcastTextService.js                ← Text validation & limits
│   ├── edgeTtsService.js                    ← Edge-TTS integration
│   └── podcastGenerationService.js          ← Main orchestration
├── routes/
│   └── podcastRoutes.js                     ← API endpoints
├── lib/
│   └── supabaseClient.js                    ← Database client
├── test-db-setup.js                         ← Diagnostic tool
├── setup-edge-tts.sh                        ← TTS installer
└── .env                                     ← Configuration
```

### Client (Frontend)
```
client/
├── app/api/server/podcasts/
│   ├── route.ts                             ← Proxy to backend
│   └── [id]/route.ts                        ← Get/delete podcast
├── components/
│   └── AudioPodcastPlayer.tsx               ← Native audio player
├── lib/
│   └── podcasts.ts                          ← API client
└── .env.local                               ← Frontend config
```

---

## 🔧 Configuration

### Required Environment Variables

**Server (`server/.env`):**
```env
# Supabase (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # ⚠️ Must be service_role, not anon!

# Anthropic (REQUIRED for text reduction)
ANTHROPIC_API_KEY=sk-ant-...

# Server port (optional)
PORT=5001
```

**Client (`client/.env.local`):**
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5001
```

---

## 🧪 Testing

### Automated Test
```bash
cd server
node test-db-setup.js
```

### Manual API Test
```bash
# Create podcast
curl -X POST http://localhost:5001/api/server/podcasts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test podcast. It demonstrates the audio-based TTS system.",
    "title": "Test Podcast",
    "userId": "test-user-123",
    "lang": "en"
  }'

# Check status (use podcastId from response)
curl http://localhost:5001/api/server/podcasts/[podcastId]
```

### End-to-End Test
1. Upload PDF at http://localhost:3000/assistant/files
2. Click "Extract Text"
3. Click "Generate Podcast"
4. Wait for "Podcast ready to play!"
5. Play in AudioPodcastPlayer

---

## 📊 Database Schema

The `podcasts` table stores:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | User who created it |
| `file_id` | TEXT | Source file (optional) |
| `title` | VARCHAR(500) | Podcast title |
| `status` | VARCHAR(20) | pending/ready/failed |
| `tts_text` | TEXT | Final text sent to TTS |
| `char_count` | INTEGER | Character count |
| `word_count` | INTEGER | Word count |
| `audio_url` | TEXT | Supabase Storage URL |
| `audio_file_id` | TEXT | Storage file ID |
| `duration` | FLOAT | Real duration from metadata |
| `voice_id` | VARCHAR(100) | Edge-TTS voice used |
| `lang` | VARCHAR(10) | Language code |
| `error_message` | TEXT | Error if failed |
| `retry_count` | INTEGER | Retry attempts |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update |
| `completed_at` | TIMESTAMP | When ready/failed |

---

## 🔒 Security

### API Key Safety
- ✅ Service role key in `server/.env` only
- ✅ Never exposed to frontend
- ✅ Backend validates user authentication
- ✅ RLS disabled (service role bypasses it)

### Input Validation
- ✅ Text length limits enforced
- ✅ Auto-reduction prevents abuse
- ✅ User ID required for all operations
- ✅ File uploads validated separately

---

## 🎨 Frontend Usage

### Creating a Podcast
```typescript
import { podcastAPI } from '@/lib/podcasts';

const result = await podcastAPI.createPodcast({
  text: extractedText,
  title: "My Podcast",
  userId: user.id,
  fileId: file.id,
  lang: "en"
});

if (result.success) {
  // Poll for completion
  const podcast = await podcastAPI.pollPodcastStatus(result.podcastId);

  if (podcast?.status === "ready") {
    // Show player
  }
}
```

### Displaying the Player
```tsx
import AudioPodcastPlayer from '@/components/AudioPodcastPlayer';

<AudioPodcastPlayer
  audioUrl={podcast.audio_url}
  title={podcast.title}
  podcastId={podcast.id}
/>
```

---

## 🚦 Status Flow

```
pending → Generating audio in background
   ↓
ready → Audio file available, can play
   OR
failed → Error occurred, can retry
```

**Polling example:**
```typescript
const podcast = await podcastAPI.pollPodcastStatus(
  podcastId,
  3000,  // Poll every 3 seconds
  100    // Max 100 attempts (5 minutes)
);
```

---

## ⚙️ Text Limits

| Limit | Value | Behavior if Exceeded |
|-------|-------|----------------------|
| Max characters | 8,000 | Auto-reduce with Claude |
| Max words | 1,500 | Auto-reduce with Claude |
| Max duration | 10-12 min | Calculated from word count |
| Min words | 10 | Validation error |

**Auto-reduction:**
- Uses Claude to create concise version
- Targets ~1200 words (safe buffer)
- Falls back to truncation if Claude fails
- User notified via `wasReduced: true`

---

## 🎤 Edge-TTS Voices

Default voices by language:
- **English (US):** `en-US-AriaNeural`
- **English (UK):** `en-GB-SoniaNeural`
- **Spanish:** `es-ES-ElviraNeural`
- **French:** `fr-FR-DeniseNeural`
- **German:** `de-DE-KatjaNeural`

List all available:
```bash
edge-tts --list-voices
```

---

## 🔄 Migration from Old System

### What Changed
| Old | New |
|-----|-----|
| Web Speech API | Edge-TTS (real MP3) |
| `generatePodcast()` | `createPodcast()` |
| Estimated durations | Real audio metadata |
| Client-side TTS | Server-side generation |
| Immediate playback | Background generation |
| No persistence | Supabase Storage |

### Files to Remove (After Testing)
- `client/components/LiveTTSPlayer.tsx`
- `client/components/PodcastPlayer.tsx` (old version)
- `client/lib/podcast/googleTtsService.ts`
- `server/services/podcastService.ts` (old version)

---

## 📈 Performance

- **Generation time:** 10-60 seconds (depends on text length)
- **Storage:** ~1-2 MB per 10 minutes of audio
- **Cost:** $0 (Edge-TTS is free)
- **Bandwidth:** Served by Supabase CDN

---

## 🛠️ Maintenance

### Cleanup Old Files
```bash
# Clean up temp files (older than 24 hours)
# Automatically handled by edgeTtsService.cleanup()
```

### Database Maintenance
```sql
-- Delete failed podcasts older than 7 days
DELETE FROM podcasts
WHERE status = 'failed'
AND created_at < NOW() - INTERVAL '7 days';
```

### Storage Cleanup
Orphaned files can be cleaned by comparing database `audio_file_id` with storage files.

---

## 🤝 Contributing

If you extend this feature:
1. Follow the same architecture principles
2. Don't break the deterministic generation
3. Maintain cost-safety (no paid APIs)
4. Keep duration from metadata (no estimation)
5. Update documentation

---

## 📝 License

Part of StudySync project.

---

## 🆘 Need Help?

1. **Run diagnostic:** `cd server && node test-db-setup.js`
2. **Check logs:** Server console + browser console
3. **Read guides:** Start with [PODCAST_ERRORS_QUICK_FIX.md](PODCAST_ERRORS_QUICK_FIX.md)
4. **Test components:** Use curl to test API directly

---

**Built with ❤️ using Edge-TTS, Supabase, and Next.js**
