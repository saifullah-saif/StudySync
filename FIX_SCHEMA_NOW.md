# Fix Schema Error - Quick Solution

## 🔴 Error

```
❌ Schema validation failed: invalid input syntax for type uuid: "test-user-123"
```

**Problem:** The `user_id` column is UUID type, but your app uses TEXT (string IDs).

---

## ✅ Quick Fix (2 Steps)

### Step 1: Run This SQL

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. **Copy and paste this SQL:**

```sql
-- Drop and recreate table with correct types
DROP TABLE IF EXISTS podcasts CASCADE;

CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- TEXT types (not UUID) to match your app
  user_id TEXT NOT NULL,
  file_id TEXT,

  -- Podcast metadata
  title VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'ready', 'failed')),

  -- Text content
  tts_text TEXT NOT NULL,
  char_count INTEGER NOT NULL,
  word_count INTEGER NOT NULL,

  -- Audio references
  audio_url TEXT,
  audio_file_id TEXT,
  duration FLOAT,

  -- TTS config
  voice_id VARCHAR(100) DEFAULT 'en-US-AriaNeural',
  lang VARCHAR(10) DEFAULT 'en',

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE podcasts TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE podcasts TO service_role;

-- Indexes
CREATE INDEX idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX idx_podcasts_file_id ON podcasts(file_id);
CREATE INDEX idx_podcasts_status ON podcasts(status);
CREATE INDEX idx_podcasts_created_at ON podcasts(created_at DESC);

-- Trigger
CREATE OR REPLACE FUNCTION update_podcasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER podcasts_updated_at_trigger
  BEFORE UPDATE ON podcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_podcasts_updated_at();

-- Disable RLS
ALTER TABLE podcasts DISABLE ROW LEVEL SECURITY;
```

4. Click **"Run"** (or press Ctrl+Enter)

---

### Step 2: Verify the Fix

```bash
cd server
node test-db-setup.js
```

**Expected Output:**
```
✅ Environment variables found
✅ Supabase connection successful
✅ Podcasts table exists
✅ Schema validation passed
   Test podcast created: abc-123...
✅ Test record cleaned up
🎉 Database setup complete!
```

---

## 🎯 What Changed

| Before | After |
|--------|-------|
| `user_id UUID` | `user_id TEXT` ✅ |
| `file_id UUID` | `file_id TEXT` ✅ |

This matches how your application sends user IDs as strings (e.g., "test-user-123"), not UUIDs.

---

## 🚀 Test It

After running the SQL:

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Test API
curl -X POST http://localhost:5001/api/server/podcasts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test podcast",
    "title": "Test",
    "userId": "test-user-123",
    "fileId": "file-456",
    "lang": "en"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "podcastId": "uuid-here",
  "status": "pending",
  "wasReduced": false,
  "metadata": {
    "charCount": 23,
    "wordCount": 5,
    "estimatedDurationMinutes": 0.03
  }
}
```

✅ If you get this, **it's fixed!**

---

## 📝 Alternative: Use the Migration File

Instead of copying SQL, you can copy from:
- [`server/migrations/002_fix_user_id_type.sql`](server/migrations/002_fix_user_id_type.sql)

Same content, just in a file for reference.

---

## ⚠️ Important Note

**This will delete any existing podcast data** because we're dropping and recreating the table. If you had test podcasts, they'll be gone (but you probably don't have any real data yet).

---

## ✅ After This Fix

Everything should work:
1. ✅ Schema matches your app
2. ✅ Can create podcasts
3. ✅ Text IDs work fine
4. ✅ Ready to generate audio

**Now run `node test-db-setup.js` to verify!** 🎉
