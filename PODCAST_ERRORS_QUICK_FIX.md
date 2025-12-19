# Podcast Errors - Quick Fix Guide

## 🚨 Common Errors & Solutions

### Error 1: "Could not find the 'char_count' column"

**Error:**
```
Database error: Could not find the 'char_count' column of 'podcasts' in the schema cache
```

**Cause:** The `podcasts` table doesn't exist.

**Fix:**
```bash
cd server
node test-db-setup.js
```

Follow the instructions to create the table.

**Full guide:** [FIX_DATABASE_ERROR.md](FIX_DATABASE_ERROR.md)

---

### Error 2: "Permission denied for schema public"

**Error:**
```
Database error: permission denied for schema public
```

**Cause:** Using the wrong Supabase API key (anon instead of service_role).

**Fix:**

1. Get **service_role** key from Supabase Dashboard → Settings → API
2. Update `server/.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (the service_role key)
   ```
3. Restart server: `npm run dev`

**Full guide:** [FIX_PERMISSION_ERROR.md](FIX_PERMISSION_ERROR.md)

---

### Error 3: "404 Not Found" + "Unexpected token '<'"

**Error:**
```
Failed to load resource: the server responded with a status of 404
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Cause:** Express backend is not running.

**Fix:**

1. Start the backend:
   ```bash
   cd server
   npm run dev
   ```

2. Verify it's running:
   ```bash
   curl http://localhost:5001/api/health
   ```

3. Ensure `.env.local` exists in `client/`:
   ```env
   NEXT_PUBLIC_SERVER_URL=http://localhost:5001
   ```

---

### Error 4: "edge-tts: command not found"

**Error:**
```
TTS generation failed: edge-tts: command not found
```

**Cause:** Edge-TTS is not installed.

**Fix:**
```bash
cd server
pip3 install edge-tts
```

Or use the setup script:
```bash
./setup-edge-tts.sh
```

Verify:
```bash
edge-tts --version
```

---

### Error 5: "Storage upload failed: Bucket not found"

**Error:**
```
Failed to upload audio to Supabase: Bucket not found
```

**Cause:** Storage bucket doesn't exist.

**Fix:**

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `podcasts`
4. Public: ✅ Yes
5. Click "Create Bucket"

---

### Error 6: Podcast stuck in "pending"

**Symptoms:** Podcast status never changes from `pending`.

**Cause:** Background generation is failing. Check server logs.

**Common reasons:**
- Edge-TTS not installed
- Supabase Storage bucket missing
- Text too long (>8000 chars should auto-reduce)
- Anthropic API key missing (for text reduction)

**Fix:**

1. Check server console for errors
2. Run setup script:
   ```bash
   cd server
   node test-db-setup.js
   ```
3. Verify Edge-TTS:
   ```bash
   edge-tts --version
   ```

---

### Error 7: "User authentication required"

**Error:**
```
Error: User authentication required
```

**Cause:** `userId` not provided in the request.

**Fix:**

Ensure you pass `userId` when creating podcast:

```typescript
const result = await podcastAPI.createPodcast({
  text: "...",
  title: "...",
  userId: user.id,  // ← Must be provided
  fileId: file.id,
  lang: "en",
});
```

---

## 🔧 Master Diagnostic Tool

Run this to check everything:

```bash
cd server
node test-db-setup.js
```

This will check:
- ✅ Environment variables
- ✅ Supabase connection
- ✅ Service role key (not anon)
- ✅ Database table exists
- ✅ Table schema is correct
- ✅ Storage bucket exists

---

## 📋 Setup Checklist

Use this to verify your setup:

### Backend
- [ ] Express server runs: `cd server && npm run dev`
- [ ] Health check works: `curl http://localhost:5001/api/health`
- [ ] `.env` has `SUPABASE_URL`
- [ ] `.env` has `SUPABASE_SERVICE_ROLE_KEY` (not anon!)
- [ ] `.env` has `ANTHROPIC_API_KEY`
- [ ] Edge-TTS installed: `edge-tts --version`

### Database
- [ ] `podcasts` table exists in Supabase
- [ ] Table has correct columns (run test script)
- [ ] Service role has permissions

### Storage
- [ ] Bucket `podcasts` exists
- [ ] Bucket is public

### Frontend
- [ ] Next.js runs: `cd client && npm run dev`
- [ ] `.env.local` has `NEXT_PUBLIC_SERVER_URL=http://localhost:5001`

---

## 🎯 Quick Start from Scratch

If nothing works, start fresh:

### 1. Environment Setup
```bash
# Server .env
cd server
cat > .env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
PORT=5001
EOF

# Client .env.local
cd ../client
cat > .env.local << 'EOF'
NEXT_PUBLIC_SERVER_URL=http://localhost:5001
EOF
```

### 2. Install Edge-TTS
```bash
cd ../server
pip3 install edge-tts
```

### 3. Setup Database
```bash
node test-db-setup.js
```

If table doesn't exist, copy SQL from:
- `server/migrations/001_create_podcasts_table_final.sql`
- Paste in Supabase SQL Editor
- Run it

### 4. Create Storage Bucket
- Supabase Dashboard → Storage → New Bucket
- Name: `podcasts`
- Public: Yes

### 5. Start Servers
```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

### 6. Test
- Go to http://localhost:3000/assistant/files
- Upload PDF
- Extract text
- Generate podcast
- ✅ Should work!

---

## 🆘 If Nothing Works

1. **Check all the above checklist items**

2. **Run diagnostic:**
   ```bash
   cd server
   node test-db-setup.js
   ```

3. **Check server logs** for specific errors

4. **Test each component separately:**
   ```bash
   # Test Supabase
   curl http://localhost:5001/api/health

   # Test Edge-TTS
   edge-tts --text "test" --write-media test.mp3

   # Test API
   curl -X POST http://localhost:5001/api/server/podcasts \
     -H "Content-Type: application/json" \
     -d '{"text":"test","title":"test","userId":"test","lang":"en"}'
   ```

5. **Read detailed guides:**
   - [FIX_DATABASE_ERROR.md](FIX_DATABASE_ERROR.md)
   - [FIX_PERMISSION_ERROR.md](FIX_PERMISSION_ERROR.md)
   - [PODCAST_TROUBLESHOOTING.md](PODCAST_TROUBLESHOOTING.md)

---

## 📚 All Documentation

- **[PODCAST_QUICKSTART.md](PODCAST_QUICKSTART.md)** - 5-minute setup
- **[PODCAST_SETUP_GUIDE.md](PODCAST_SETUP_GUIDE.md)** - Complete guide
- **[FIX_DATABASE_ERROR.md](FIX_DATABASE_ERROR.md)** - Table not found
- **[FIX_PERMISSION_ERROR.md](FIX_PERMISSION_ERROR.md)** - Permission denied
- **[PODCAST_TROUBLESHOOTING.md](PODCAST_TROUBLESHOOTING.md)** - All other issues
- **[PODCAST_IMPLEMENTATION_SUMMARY.md](PODCAST_IMPLEMENTATION_SUMMARY.md)** - Architecture
- **[PODCAST_API_MIGRATION.md](PODCAST_API_MIGRATION.md)** - API reference

---

**For most errors, running `node server/test-db-setup.js` will diagnose and guide you to the fix!** 🎯
