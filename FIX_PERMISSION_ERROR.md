# Fix: "Permission denied for schema public" Error

## 🔴 Error Explained

```
Database error: permission denied for schema public
```

**Root Cause:** You're using the wrong Supabase API key. The **anon** key has read-only permissions, but the server needs the **service_role** key to write to the database.

---

## ✅ Quick Fix (2 Steps)

### Step 1: Get the Correct API Key

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Find the **"service_role"** key (NOT the "anon" key)
5. Click the eye icon to reveal it
6. Copy the entire key

**Important:**
- ✅ Use: **service_role** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- ❌ Don't use: **anon** key (has limited permissions)

---

### Step 2: Update Your `.env` File

Open [`server/.env`](server/.env) and update:

```env
# ❌ WRONG - This is the anon key (read-only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...eyJyb2xlIjoiYW5vbiIsImlhdCI6...

# ✅ CORRECT - This is the service_role key (full access)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0Ijoi...
```

**How to tell them apart:**
- Decode the JWT at [jwt.io](https://jwt.io)
- Look for `"role"` field:
  - ❌ `"role": "anon"` → Wrong key
  - ✅ `"role": "service_role"` → Correct key

---

### Step 3: Restart Your Server

After updating `.env`:

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd server
npm run dev
```

---

## 🧪 Verify the Fix

Run the test script:

```bash
cd server
node test-db-setup.js
```

**Expected Output:**

```
0️⃣ Checking environment variables...
✅ Environment variables found
   SUPABASE_URL: https://xxx.supabase.co
   SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiI...

1️⃣ Testing Supabase connection...
✅ Supabase connection successful

2️⃣ Checking if podcasts table exists...
✅ Podcasts table exists

3️⃣ Verifying table schema...
✅ Schema validation passed
   Test podcast created: abc-123...
✅ Test record cleaned up

🎉 Database setup complete!
```

**If you see:**
```
❌ You're using the ANON key, not the SERVICE ROLE key!
```

→ You need to get the correct key from Supabase Dashboard.

---

## 🛠️ Alternative: Grant Permissions (Advanced)

If you absolutely must use a different role, you can grant permissions manually:

**Run in Supabase SQL Editor:**

```sql
-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE podcasts TO postgres, service_role;
```

**But the easier fix is just using the service_role key!**

---

## 📋 Complete Setup Checklist

After fixing the key:

### 1. Verify Environment Variables

```bash
cd server
cat .env | grep SUPABASE
```

Should show:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (long key starting with eyJ)
```

### 2. Run Database Setup

```bash
node test-db-setup.js
```

Should pass all tests.

### 3. Run Migration (if table doesn't exist)

If the test says table doesn't exist:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of [`server/migrations/001_create_podcasts_table_final.sql`](server/migrations/001_create_podcasts_table_final.sql)
3. Paste and run

### 4. Test API Endpoint

```bash
# Start server
npm run dev

# In another terminal, test:
curl -X POST http://localhost:5001/api/server/podcasts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test podcast",
    "title": "Test",
    "userId": "test-123",
    "lang": "en"
  }'
```

Expected:
```json
{
  "success": true,
  "podcastId": "...",
  "status": "pending"
}
```

---

## 🔍 How to Find Your Service Role Key

### Visual Guide:

1. **Supabase Dashboard** → Your Project

2. **Settings** (⚙️ gear icon in sidebar)

3. **API** (in Settings section)

4. Scroll to **"Project API keys"**

5. You'll see two keys:
   ```
   anon public          → ❌ Don't use this
   service_role secret  → ✅ Use this one!
   ```

6. Click the 👁️ icon next to **service_role**

7. Click **Copy** button

8. Paste into `server/.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=<paste here>
   ```

---

## ⚠️ Common Mistakes

### Mistake 1: Using anon key
```env
# ❌ WRONG
SUPABASE_SERVICE_ROLE_KEY=eyJ...anon...
```

**Fix:** Get the service_role key instead.

### Mistake 2: Missing the key entirely
```env
# ❌ WRONG - Key not set
SUPABASE_SERVICE_ROLE_KEY=
```

**Fix:** Copy the full key from Supabase Dashboard.

### Mistake 3: Using the anon key variable name
```env
# ❌ WRONG - This is the anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# ✅ CORRECT - Use this for server
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Fix:** Server needs `SUPABASE_SERVICE_ROLE_KEY`, not `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 🎯 Why Service Role Key?

| Key Type | Permissions | Use Case |
|----------|-------------|----------|
| **anon** | Read-only, limited | Frontend/browser code |
| **service_role** | Full access | Backend/server code |

**Service role key:**
- ✅ Can INSERT, UPDATE, DELETE
- ✅ Bypasses Row Level Security (RLS)
- ✅ Has full database access
- ⚠️ Should NEVER be exposed to frontend
- ⚠️ Keep it in server `.env` only

**Anon key:**
- ✅ Safe to expose in frontend
- ❌ Limited by RLS policies
- ❌ Cannot write to most tables
- ❌ Not suitable for server operations

---

## ✅ After the Fix

Once you have the correct key:

1. ✅ "Permission denied" error → **Gone**
2. ✅ Can create podcasts → **Works**
3. ✅ Background generation → **Works**
4. ✅ Audio storage → **Works**

---

## 🆘 Still Getting Permission Error?

### Debug Steps:

1. **Verify the key type:**
   ```bash
   echo $SUPABASE_SERVICE_ROLE_KEY | cut -d'.' -f2 | base64 -d 2>/dev/null
   ```

   Should show: `"role":"service_role"`

2. **Check server is using the key:**
   ```bash
   cd server
   node -e "require('dotenv').config(); console.log(process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0,20))"
   ```

   Should print first 20 characters of the key.

3. **Restart everything:**
   ```bash
   # Stop all servers
   # Clear any caches
   cd server
   npm run dev
   ```

4. **Check Supabase logs:**
   - Supabase Dashboard → Logs
   - Look for authentication errors

---

## 📖 Related Guides

- [FIX_DATABASE_ERROR.md](FIX_DATABASE_ERROR.md) - If table doesn't exist
- [PODCAST_TROUBLESHOOTING.md](PODCAST_TROUBLESHOOTING.md) - Other common issues
- [PODCAST_QUICKSTART.md](PODCAST_QUICKSTART.md) - Full setup guide

---

**TL;DR: Use the service_role key from Supabase Dashboard → Settings → API, put it in `server/.env` as `SUPABASE_SERVICE_ROLE_KEY`, then restart the server.** 🎯
