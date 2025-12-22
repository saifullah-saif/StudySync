# Podcast Feature Quick Start

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites
- Node.js and npm installed
- Python 3.x installed
- Supabase project created
- Git repository cloned

---

## Step 1: Database Setup (2 minutes)

### Option A: Supabase Dashboard
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to SQL Editor
3. Copy contents of [`server/migrations/001_create_podcasts_table.sql`](server/migrations/001_create_podcasts_table.sql)
4. Paste and click "Run"

### Option B: Command Line
```bash
psql YOUR_DATABASE_URL < server/migrations/001_create_podcasts_table.sql
```

### Create Storage Bucket
1. In Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `podcasts`
4. Public: ✅ Yes
5. Click "Create Bucket"

---

## Step 2: Install Edge-TTS (1 minute)

```bash
cd server
chmod +x setup-edge-tts.sh
./setup-edge-tts.sh
```

Or manually:
```bash
pip3 install edge-tts
```

Verify:
```bash
edge-tts --version
```

---

## Step 3: Environment Variables (1 minute)

### Server `.env`
Create or update [`server/.env`](server/.env):

```env
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic (required for text reduction)
ANTHROPIC_API_KEY=sk-ant-...

# Server port (optional)
PORT=5001
```

### Client `.env.local`
Create [`client/.env.local`](client/.env.local):

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5001
```

---

## Step 4: Start Servers (1 minute)

### Terminal 1: Express Backend
```bash
cd server
npm install  # First time only
npm run dev
```

Expected output:
```
Server is running on port 5001
Environment: development
Health check: http://localhost:5001/api/health
```

### Terminal 2: Next.js Frontend
```bash
cd client
npm install  # First time only
npm run dev
```

Expected output:
```
Ready on http://localhost:3000
```

---

## Step 5: Test It! (30 seconds)

### Quick Test via Browser

1. Go to http://localhost:3000/assistant/files
2. Upload a PDF file
3. Click "Extract Text" on the file
4. Click "Generate Podcast"
5. Wait for generation (10-60 seconds depending on text length)
6. Play the podcast!

### Quick Test via API

```bash
# Test health
curl http://localhost:5001/api/health

# Create test podcast
curl -X POST http://localhost:5001/api/server/podcasts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test podcast. The quick brown fox jumps over the lazy dog. This demonstrates the text to speech functionality.",
    "title": "Test Podcast",
    "userId": "test-user-123",
    "lang": "en"
  }'

# Response will include podcastId
# Copy the podcastId and check status:
curl http://localhost:5001/api/server/podcasts/YOUR_PODCAST_ID
```

---

## ✅ Verification Checklist

After setup, verify everything works:

### Backend
- [ ] Server runs on port 5001
- [ ] `/api/health` returns JSON
- [ ] Database has `podcasts` table
- [ ] Edge-TTS is installed
- [ ] Supabase env vars are set

### Storage
- [ ] `podcasts` bucket exists in Supabase
- [ ] Bucket is public

### Frontend
- [ ] Next.js runs on port 3000
- [ ] Can upload and extract PDF
- [ ] Can generate podcast
- [ ] Audio player appears and plays

---

## 🎯 Expected Flow

1. **User uploads PDF** → File stored in database
2. **User clicks "Extract Text"** → PDF text extracted
3. **User clicks "Generate Podcast"** →
   - Frontend calls `createPodcast()`
   - Backend creates record with status `"pending"`
   - Backend starts generation in background
   - Edge-TTS generates MP3 file
   - MP3 uploaded to Supabase Storage
   - Status updated to `"ready"`
4. **User sees podcast player** → Native audio with real MP3
5. **User plays podcast** → Actual audio file streams from Supabase

---

## 🐛 Common Issues

### Issue: "edge-tts: command not found"
**Fix:** Install Edge-TTS
```bash
pip3 install edge-tts
```

### Issue: "Database error: relation 'podcasts' does not exist"
**Fix:** Run the migration SQL in Supabase

### Issue: "Storage upload failed: Bucket not found"
**Fix:** Create `podcasts` bucket in Supabase Storage

### Issue: 404 error when creating podcast
**Fix:** Ensure Express backend is running on port 5001

### Issue: Podcast stuck in "pending"
**Fix:** Check server logs for errors. Likely Edge-TTS or Supabase issue.

---

## 📚 Next Steps

### For Development
- See [PODCAST_IMPLEMENTATION_SUMMARY.md](PODCAST_IMPLEMENTATION_SUMMARY.md) for architecture details
- See [PODCAST_TROUBLESHOOTING.md](PODCAST_TROUBLESHOOTING.md) for debugging help
- See [PODCAST_API_MIGRATION.md](PODCAST_API_MIGRATION.md) for API reference

### For Production
- Set production environment variables
- Use production Supabase project
- Configure CORS properly
- Set up monitoring/logging
- Test with various PDF sizes

---

## 🎉 You're Done!

The podcast feature is now ready to use. Upload a PDF, generate a podcast, and enjoy real audio-based TTS!

**Key Features:**
- ✅ Real audio files (not Web Speech API)
- ✅ Free forever (Edge-TTS)
- ✅ Smart text limits (auto-reduces long content)
- ✅ Native audio controls (seeking, speed, volume)
- ✅ Persistent storage (Supabase)
- ✅ State management (pending/ready/failed)

For questions or issues, check the troubleshooting guide or review the server logs.
