# Podcast Feature Troubleshooting Guide

## Common Errors and Solutions

### ❌ Error: 404 Not Found + "Unexpected token '<'"

**Symptoms:**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
Generate podcast error: Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Cause:**
The Express backend is not running, or Next.js cannot reach it.

**Solution:**

#### Step 1: Verify Express Backend is Running

```bash
cd server
node server.js
```

You should see:
```
Server is running on port 5001
Environment: development
Health check: http://localhost:5001/api/health
```

#### Step 2: Test Backend Directly

```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-..."
}
```

If you get a connection error, the backend is not running.

#### Step 3: Check Environment Variable

Create or update [`client/.env.local`](client/.env.local):

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5001
```

Restart your Next.js dev server:
```bash
cd client
npm run dev
```

#### Step 4: Verify Proxy Routes Exist

The following Next.js API proxy routes were created:
- [`client/app/api/server/podcasts/route.ts`](client/app/api/server/podcasts/route.ts)
- [`client/app/api/server/podcasts/[id]/route.ts`](client/app/api/server/podcasts/[id]/route.ts)
- [`client/app/api/server/podcasts/[id]/retry/route.ts`](client/app/api/server/podcasts/[id]/retry/route.ts)

These proxy Next.js API routes to the Express backend.

---

### ❌ Error: "User authentication required"

**Cause:**
`userId` is missing in the request.

**Solution:**

Check that the user is logged in:

```typescript
const { user } = useAuth();

if (!user?.id) {
  toast.error("Please log in first");
  return;
}

const result = await podcastAPI.createPodcast({
  text: extractedText,
  title: "My Podcast",
  userId: user.id,  // ✅ Required
  fileId: file.id,
  lang: "en",
});
```

---

### ❌ Error: Podcast stuck in "pending" status

**Symptoms:**
Podcast status never changes from `"pending"` to `"ready"`.

**Cause:**
Background generation is failing. Check server logs.

**Solution:**

#### Step 1: Check Server Logs

Look for errors in the Express server console:

```
❌ Edge-TTS generation failed: ...
❌ Failed to upload to Supabase: ...
```

#### Step 2: Verify Edge-TTS is Installed

```bash
edge-tts --version
```

If not installed:
```bash
cd server
./setup-edge-tts.sh
```

Or manually:
```bash
pip3 install edge-tts
```

#### Step 3: Check Supabase Storage

- Go to Supabase Dashboard → Storage
- Verify bucket `podcasts` exists
- Check bucket is public or has proper RLS policies

#### Step 4: Check Database

Query the podcasts table:
```sql
SELECT id, status, error_message
FROM podcasts
ORDER BY created_at DESC
LIMIT 5;
```

If status is `"failed"`, check the `error_message` column.

---

### ❌ Error: "Failed to upload audio to Supabase"

**Cause:**
Storage bucket doesn't exist or permissions are wrong.

**Solution:**

#### Step 1: Create Storage Bucket

1. Go to Supabase Dashboard
2. Navigate to Storage
3. Click "New Bucket"
4. Name: `podcasts`
5. Public: Yes (or configure RLS)

#### Step 2: Verify Environment Variables

In [`server/.env`](server/.env):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:** Use `SUPABASE_SERVICE_ROLE_KEY`, not the anon key.

#### Step 3: Test Upload Manually

Create a test script [`server/test-storage.js`](server/test-storage.js):

```javascript
const supabase = require("./lib/supabaseClient");
const fs = require("fs");

async function testUpload() {
  const testBuffer = Buffer.from("test audio file");

  const { data, error } = await supabase.storage
    .from("podcasts")
    .upload("test.mp3", testBuffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) {
    console.error("Upload failed:", error);
  } else {
    console.log("Upload success:", data);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("podcasts")
      .getPublicUrl("test.mp3");

    console.log("Public URL:", publicUrlData.publicUrl);
  }
}

testUpload();
```

Run:
```bash
node server/test-storage.js
```

---

### ❌ Error: Text reduction not working

**Cause:**
Anthropic API key is missing or invalid.

**Solution:**

#### Step 1: Set API Key

In [`server/.env`](server/.env):

```env
ANTHROPIC_API_KEY=sk-ant-...
```

#### Step 2: Verify API Key

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

Should return a JSON response (not an error).

#### Step 3: Fallback Behavior

If Claude API fails, the system automatically falls back to simple truncation at 1200 words. Check server logs:

```
⚠️  Falling back to simple truncation...
```

---

### ❌ Error: Audio won't play in browser

**Cause:**
Audio URL is invalid or CORS is blocking it.

**Solution:**

#### Step 1: Verify Audio URL

Open the audio URL directly in browser. It should download or play the MP3 file.

Example:
```
https://your-project.supabase.co/storage/v1/object/public/podcasts/abc123.mp3
```

#### Step 2: Check CORS Settings

In Supabase Storage bucket settings, ensure CORS allows your domain:

```
Allowed Origins: *
```

Or specific origins:
```
http://localhost:3000
https://your-app.com
```

#### Step 3: Check Audio File Metadata

The `AudioPodcastPlayer` component requires:
- Valid `audio_url` (not null or empty)
- Audio file exists and is accessible

Debug:
```typescript
console.log("Audio URL:", podcast.audio_url);
console.log("Duration:", podcast.duration);
```

---

## Diagnostic Checklist

Run through this checklist to identify issues:

### Backend
- [ ] Express server running on port 5001
- [ ] Health endpoint works: `curl http://localhost:5001/api/health`
- [ ] Database migration applied (podcasts table exists)
- [ ] Edge-TTS installed: `edge-tts --version`
- [ ] Supabase credentials set in `.env`

### Storage
- [ ] Supabase Storage bucket `podcasts` exists
- [ ] Bucket is public or has correct RLS
- [ ] Can upload test file to bucket

### Frontend
- [ ] Next.js dev server running on port 3000
- [ ] `.env.local` has `NEXT_PUBLIC_SERVER_URL`
- [ ] Proxy routes exist in `client/app/api/server/podcasts/`
- [ ] User is authenticated (has `userId`)

### Podcast Flow
- [ ] Can create podcast (status: "pending")
- [ ] Background generation completes (status: "ready")
- [ ] Audio file appears in Supabase Storage
- [ ] Duration is populated from metadata
- [ ] Audio player loads and plays

---

## Debug Mode

### Enable Detailed Logging

In [`client/lib/podcasts.ts`](client/lib/podcasts.ts), logging is already enabled:

```typescript
console.log("📡 Creating podcast...", request);
console.log("📥 Response status:", response.status);
console.log("📥 Response data:", data);
```

Check browser console for these logs.

In [`server/services/podcastGenerationService.js`](server/services/podcastGenerationService.js), logging is enabled:

```typescript
console.log("🎙️  Creating new podcast...");
console.log("🔄 Starting audio generation for podcast...");
console.log("✅ Podcast generation complete");
```

Check server console for these logs.

### Test Each Step Independently

#### Test 1: Create Podcast
```bash
curl -X POST http://localhost:5001/api/server/podcasts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test podcast. It should be converted to audio.",
    "title": "Test Podcast",
    "userId": "test-user-123",
    "lang": "en"
  }'
```

Expected:
```json
{
  "success": true,
  "podcastId": "uuid-here",
  "status": "pending"
}
```

#### Test 2: Check Status
```bash
curl http://localhost:5001/api/server/podcasts/[podcastId]
```

Expected (after generation):
```json
{
  "success": true,
  "podcast": {
    "id": "uuid",
    "status": "ready",
    "audio_url": "https://...",
    "duration": 15.23
  }
}
```

#### Test 3: Edge-TTS Direct
```bash
edge-tts --text "This is a test" --write-media test.mp3
```

Should create `test.mp3` file.

---

## Still Having Issues?

### Check Server Logs

Look for specific error messages:

| Error Message | Solution |
|---------------|----------|
| "edge-tts: command not found" | Install Edge-TTS: `pip3 install edge-tts` |
| "Database error: relation 'podcasts' does not exist" | Run migration SQL |
| "Storage upload failed: Bucket not found" | Create `podcasts` bucket in Supabase |
| "Invalid text: Text must be..." | Check text validation rules |
| "TTS synthesis failed" | Check Edge-TTS installation |

### Common Port Conflicts

If port 5001 is in use:

```bash
# Kill existing process
lsof -ti:5001 | xargs kill -9

# Or use different port
PORT=5002 node server/server.js
```

Then update `.env.local`:
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5002
```

### Database Connection Issues

Test Supabase connection:

```javascript
// server/test-db.js
const supabase = require("./lib/supabaseClient");

async function testConnection() {
  const { data, error } = await supabase
    .from("podcasts")
    .select("count")
    .limit(1);

  if (error) {
    console.error("Database error:", error);
  } else {
    console.log("Database connected successfully");
  }
}

testConnection();
```

---

## Getting Help

If you're still stuck:

1. **Check Server Logs** - Look for specific error messages
2. **Check Browser Console** - Look for network errors or API failures
3. **Test Each Component** - Use curl to test backend endpoints directly
4. **Verify Setup** - Go through the setup guide step by step

For setup instructions, see [PODCAST_SETUP_GUIDE.md](PODCAST_SETUP_GUIDE.md).
