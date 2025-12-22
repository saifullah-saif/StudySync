# Audio-Based TTS Podcast Setup Guide

This guide covers the complete setup for the redesigned podcast feature using audio-based TTS with Edge-TTS.

## Architecture Overview

### Core Principles
✅ Real audio files (no Web Speech API)
✅ Three states only: `pending`, `ready`, `failed`
✅ One generation = one TTS call
✅ No regeneration on revisit
✅ Real audio duration from metadata
✅ Native HTML5 audio playback

### Text Limits (Enforced Before TTS)
- **Max characters**: 8,000
- **Max words**: 1,500
- **Max duration**: 10-12 minutes
- **Auto-reduction**: Text exceeding limits is automatically summarized using Claude

### Technology Stack
- **TTS Engine**: Edge-TTS (Microsoft Edge's TTS - completely free)
- **Storage**: Supabase Storage for audio files
- **Database**: Supabase (PostgreSQL)
- **Player**: Native HTML5 `<audio>` element

---

## Setup Instructions

### Step 1: Database Setup

Run the migration to create the `podcasts` table:

```bash
# Apply the migration in Supabase SQL Editor or via CLI
psql your_database < server/migrations/001_create_podcasts_table.sql
```

**Or manually in Supabase Dashboard**:
1. Go to Supabase SQL Editor
2. Copy contents of `server/migrations/001_create_podcasts_table.sql`
3. Execute the SQL

### Step 2: Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `podcasts`
3. Set bucket to **public** (or configure signed URLs if private)
4. Note: Audio files will be uploaded here automatically

### Step 3: Install Edge-TTS

Edge-TTS requires Python 3. Install it:

```bash
# Navigate to server directory
cd server

# Run the setup script
chmod +x setup-edge-tts.sh
./setup-edge-tts.sh
```

**Or install manually**:
```bash
pip3 install edge-tts
```

**Verify installation**:
```bash
edge-tts --version
```

### Step 4: Environment Variables

Ensure your `.env` file has:

```env
# Supabase (required)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic (required for text reduction)
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Step 5: Register Podcast Routes

Add podcast routes to your Express server:

**In `server/server.js` or `server/app.js`**:

```javascript
const podcastRoutes = require('./routes/podcastRoutes');

// Add this line with your other routes
app.use('/api/server/podcasts', podcastRoutes);
```

### Step 6: Install Dependencies

```bash
cd server
npm install
```

---

## API Endpoints

### Create Podcast
```
POST /api/server/podcasts
Body: {
  "text": "Your text content...",
  "title": "Podcast Title",
  "userId": "user-uuid",
  "fileId": "file-uuid" (optional),
  "lang": "en" (optional)
}
Response: {
  "success": true,
  "podcastId": "uuid",
  "status": "pending",
  "metadata": { ... }
}
```

### Get Podcast
```
GET /api/server/podcasts/:id
Response: {
  "success": true,
  "podcast": { ... }
}
```

### List User Podcasts
```
GET /api/server/podcasts?userId=user-uuid
Response: {
  "success": true,
  "podcasts": [ ... ],
  "count": 5
}
```

### Retry Failed Podcast
```
POST /api/server/podcasts/:id/retry
Response: {
  "success": true,
  "status": "pending"
}
```

### Delete Podcast
```
DELETE /api/server/podcasts/:id
Response: {
  "success": true
}
```

---

## Client Usage

### Import the API Client

```typescript
import { podcastAPI } from '@/lib/podcasts';
```

### Create a Podcast

```typescript
const result = await podcastAPI.createPodcast({
  text: extractedText,
  title: "My Podcast",
  userId: currentUser.id,
  fileId: file.id,
  lang: "en"
});

if (result.success) {
  console.log("Podcast created:", result.podcastId);
  console.log("Status:", result.status); // "pending"

  // Poll for completion
  const podcast = await podcastAPI.pollPodcastStatus(result.podcastId);

  if (podcast?.status === "ready") {
    console.log("Podcast ready!", podcast.audio_url);
  }
}
```

### Display Podcast Player

```tsx
import AudioPodcastPlayer from '@/components/AudioPodcastPlayer';

// When status is "ready"
<AudioPodcastPlayer
  audioUrl={podcast.audio_url}
  title={podcast.title}
  podcastId={podcast.id}
/>
```

### Handle Different States

```tsx
{podcast.status === "pending" && (
  <div>Generating podcast... Please wait.</div>
)}

{podcast.status === "ready" && (
  <AudioPodcastPlayer audioUrl={podcast.audio_url} title={podcast.title} />
)}

{podcast.status === "failed" && (
  <div>
    <p>Generation failed: {podcast.error_message}</p>
    <button onClick={() => podcastAPI.retryPodcast(podcast.id)}>
      Retry
    </button>
  </div>
)}
```

---

## State Flow Diagram

```
User Creates Podcast
        ↓
   [PENDING] ← Database record created
        ↓
   Background: Generate audio with Edge-TTS
        ↓
   Background: Upload to Supabase Storage
        ↓
   Background: Get duration from audio metadata
        ↓
    ┌───┴───┐
    ↓       ↓
[READY]  [FAILED]
    ↓       ↓
  Play    Retry
```

---

## File Structure

```
server/
├── migrations/
│   └── 001_create_podcasts_table.sql
├── services/
│   ├── podcastTextService.js          # Text validation & limits
│   ├── edgeTtsService.js              # Edge-TTS integration
│   └── podcastGenerationService.js    # Main orchestration
├── routes/
│   └── podcastRoutes.js               # API endpoints
└── setup-edge-tts.sh                  # TTS setup script

client/
├── lib/
│   └── podcasts.ts                    # API client
└── components/
    └── AudioPodcastPlayer.tsx         # Native audio player
```

---

## Important Notes

### Cost Safety
✅ Edge-TTS is **completely free** (no API key, no billing)
✅ Text automatically reduced if exceeds limits
✅ One generation per podcast (cached by content hash)
✅ No retries without explicit user action

### Duration Accuracy
✅ Duration comes from actual audio file metadata via ffprobe
❌ NO estimated durations
❌ NO calculated timings
❌ NO fake timers

### Playback Architecture
✅ Uses native HTML5 `<audio>` element
✅ Seeking is native (`audio.currentTime`)
✅ Timeline is real (`audio.duration`)
❌ NO Web Speech API
❌ NO chunk-based playback
❌ NO simulated progress

### Failure Handling
✅ Failures are explicit and visible
✅ Error messages stored in database
✅ Manual retry available
❌ NO automatic retries
❌ NO silent fallbacks
❌ NO partial audio

---

## Troubleshooting

### Edge-TTS Not Found
```bash
pip3 install edge-tts
# Verify
edge-tts --version
```

### Audio Upload Fails
- Check Supabase Storage bucket `podcasts` exists
- Verify bucket is public or signed URLs configured
- Check `SUPABASE_SERVICE_ROLE_KEY` in env

### Text Reduction Not Working
- Verify `ANTHROPIC_API_KEY` is set
- Check Claude API quota
- Fallback: Simple truncation will be used

### Podcasts Stuck in "Pending"
- Check server logs for Edge-TTS errors
- Verify Edge-TTS is installed and accessible
- Check disk space in `/tmp/studysync-podcasts`

---

## Testing Checklist

- [ ] Create podcast with short text (< 1500 words)
- [ ] Create podcast with long text (> 1500 words) - should auto-reduce
- [ ] Verify "pending" status shows immediately
- [ ] Verify audio file appears in Supabase Storage
- [ ] Verify "ready" status after generation
- [ ] Play podcast with native controls
- [ ] Test seeking (forward/backward)
- [ ] Test playback speed changes
- [ ] Test volume controls
- [ ] Verify duration is accurate (from metadata)
- [ ] Test retry on failed podcast
- [ ] Test delete podcast (removes from storage)
- [ ] Verify no regeneration on page refresh

---

## Migration from Old System

### Files to Remove (After Testing)
- `client/components/LiveTTSPlayer.tsx` (uses Web Speech API)
- `client/components/PodcastPlayer.tsx` (old implementation)
- `client/lib/podcast/googleTtsService.ts` (Google TTS)
- `server/services/podcastService.ts` (old service)
- `client/app/api/podcasts/generate/route.ts` (old API)

### Files to Keep
- `client/components/AudioPodcastPlayer.tsx` (new player)
- `client/lib/podcasts.ts` (updated API client)
- All new server services and routes

---

## Production Deployment

### Pre-Deploy Checklist
1. ✅ Run database migration
2. ✅ Create Supabase Storage bucket
3. ✅ Install Edge-TTS on server
4. ✅ Set environment variables
5. ✅ Test podcast creation end-to-end
6. ✅ Verify audio playback works
7. ✅ Test failure scenarios

### Server Requirements
- Python 3.x (for Edge-TTS)
- Node.js (for Express server)
- ffmpeg/ffprobe (usually pre-installed)
- Sufficient disk space in `/tmp`

---

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify Edge-TTS installation: `edge-tts --version`
3. Test database connection to Supabase
4. Check Supabase Storage bucket permissions

---

**This is a complete, deterministic, cost-safe podcast system. No estimation. No simulation. Just real audio.**
