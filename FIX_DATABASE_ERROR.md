# Fix: "Could not find the 'char_count' column" Error

## 🔴 Error Explained

```
Database error: Could not find the 'char_count' column of 'podcasts' in the schema cache
```

**Root Cause:** The `podcasts` table doesn't exist in your Supabase database yet. You need to run the migration to create it.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Run Database Setup Script

This script will check your database and guide you:

```bash
cd server
node test-db-setup.js
```

**Expected Output:**
- ✅ If table exists: "Database setup complete!"
- ❌ If table missing: Will show you the SQL to run

---

### Step 2: Create the Table (If Needed)

If the script says the table doesn't exist, follow these steps:

#### Option A: Supabase Dashboard (Recommended)

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click "New Query"
5. Copy the entire contents of [`server/migrations/001_create_podcasts_table_v2.sql`](server/migrations/001_create_podcasts_table_v2.sql)
6. Paste into the editor
7. Click **"Run"** (or press Ctrl+Enter)

You should see: ✅ Success. No rows returned

#### Option B: Command Line (If you have psql)

```bash
# Get your database URL from Supabase Dashboard → Settings → Database
psql "YOUR_DATABASE_URL" < server/migrations/001_create_podcasts_table_v2.sql
```

---

### Step 3: Verify Setup

Run the test script again:

```bash
node server/test-db-setup.js
```

**Expected Output:**
```
🔧 Setting up podcasts database...

1️⃣ Testing Supabase connection...
✅ Supabase connection successful

2️⃣ Checking if podcasts table exists...
✅ Podcasts table exists

3️⃣ Verifying table schema...
✅ Schema validation passed
   Test podcast created: abc-123-...
✅ Test record cleaned up

4️⃣ Checking Supabase Storage bucket...
✅ 'podcasts' bucket exists
   Public: Yes

════════════════════════════════════════════════════════════
🎉 Database setup complete!
════════════════════════════════════════════════════════════

✅ Your database is ready for podcast generation.
```

---

## 📋 Complete SQL (Copy-Paste Ready)

If you prefer to copy the SQL directly, here it is:

```sql
-- Podcasts table for audio-based TTS podcast generation
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User and file references
  user_id TEXT NOT NULL,
  file_id TEXT,

  -- Podcast metadata
  title VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'ready', 'failed')),

  -- Text content (stored for deterministic generation)
  tts_text TEXT NOT NULL,
  char_count INTEGER NOT NULL,
  word_count INTEGER NOT NULL,

  -- Audio file references
  audio_url TEXT,
  audio_file_id TEXT,
  duration FLOAT,

  -- TTS configuration
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_file_id ON podcasts(file_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON podcasts(status);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON podcasts(created_at DESC);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION update_podcasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS podcasts_updated_at_trigger ON podcasts;

CREATE TRIGGER podcasts_updated_at_trigger
  BEFORE UPDATE ON podcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_podcasts_updated_at();

-- Disable RLS (we're using service role)
ALTER TABLE podcasts DISABLE ROW LEVEL SECURITY;
```

---

## 🪣 Don't Forget: Storage Bucket

You also need a Supabase Storage bucket named `podcasts`:

1. Go to Supabase Dashboard → **Storage**
2. Click **"New Bucket"**
3. Name: `podcasts`
4. Public: ✅ **Yes**
5. Click **"Create Bucket"**

---

## 🧪 Test the Fix

After running the migration, test it:

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Test API
curl -X POST http://localhost:5001/api/server/podcasts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test podcast.",
    "title": "Test",
    "userId": "test-123",
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

---

## ❓ Troubleshooting

### Still Getting Database Error?

**Check your `.env` file:**

```bash
cd server
cat .env | grep SUPABASE
```

You should see:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Important:** Use the **Service Role Key**, not the anon key!

Find it in: Supabase Dashboard → Settings → API → Service Role (secret)

### Error: "relation 'podcasts' does not exist"

The migration didn't run. Go back to Step 2.

### Error: "permission denied for table podcasts"

Your RLS policies are blocking access. Run this in SQL Editor:

```sql
ALTER TABLE podcasts DISABLE ROW LEVEL SECURITY;
```

### Table Already Exists with Wrong Schema?

Drop and recreate:

```sql
DROP TABLE IF EXISTS podcasts CASCADE;
-- Then run the CREATE TABLE statement again
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Table `podcasts` exists in Supabase
- [ ] Table has columns: `id`, `user_id`, `title`, `status`, `tts_text`, `char_count`, `word_count`, etc.
- [ ] Storage bucket `podcasts` exists
- [ ] Bucket is public
- [ ] `.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Test script passes: `node test-db-setup.js`

---

## 🎯 What This Fixes

After running the migration:

✅ "char_count column not found" → **Fixed**
✅ "podcasts table does not exist" → **Fixed**
✅ Can create podcasts via API → **Fixed**
✅ Podcast generation will work → **Ready**

---

## 🚀 Ready to Go!

Once the migration is complete:

1. Start backend: `cd server && npm run dev`
2. Start frontend: `cd client && npm run dev`
3. Go to: http://localhost:3000/assistant/files
4. Upload a PDF
5. Extract text
6. Generate podcast
7. ✅ Should work!

---

**Need help?** Run `node server/test-db-setup.js` - it will diagnose issues and show you exactly what to do.
