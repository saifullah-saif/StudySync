# Debugging 500 Error in Flashcard Generation

## Current Issue

`AxiosError: Request failed with status code 500` when calling `/api/documents/generate-flashcards`

## Changes Made to Help Debug

### Backend Improvements (`server/controller/documentController.js`)

1. **Added User Authentication Check**

   ```javascript
   if (!userId) {
     return res.status(401).json({
       success: false,
       message: "User authentication required",
       details: "Please log in to generate flashcards",
     });
   }
   ```

2. **Enhanced Error Logging**

   ```javascript
   console.log("📥 FULL REQUEST BODY:", JSON.stringify(req.body, null, 2));
   console.log("👤 User from req.user:", req.user);
   console.log("📊 Generation parameters:", {
     textLength: sourceText.length,
     maxCards,
     difficultyLevel,
     hasGroq,
     hasHuggingFace,
   });
   ```

3. **Wrapped Job Creation in Try-Catch**

   - Now catches database errors during job creation
   - Provides clearer error messages

4. **Safe Job Update in Error Handler**

   - Only updates job status if job was successfully created
   - Prevents secondary errors in error handling

5. **Detailed Error Response**
   ```javascript
   console.error("❌ Error details:", {
     message: error.message,
     code: error.code,
     meta: error.meta,
   });
   ```

## Debugging Steps

### 1. Check Backend Server Logs

Restart your backend server and watch for these log messages:

```bash
cd server
npm run dev  # or nodemon server.js
```

Look for:

- ✅ Groq AI configured
- ✅ Hugging Face AI configured
- 📥 FULL REQUEST BODY
- 👤 User from req.user
- 📝 Creating generation job
- 🎯 Starting flashcard generation

### 2. Run Test Script

Use the provided test script to isolate the issue:

```bash
cd server
node test-flashcard-generation.js
```

Update the script with your test credentials first!

### 3. Common Issues to Check

#### Issue A: Authentication Failure

**Symptom:** `req.user` is undefined  
**Check:**

- Is JWT middleware applied to the route?
- Is the user logged in on the frontend?
- Are cookies being forwarded correctly?

**Fix:** Check `server/routes/*.js` to ensure `verifyTokenFromCookie` middleware is applied

#### Issue B: Database Schema Missing

**Symptom:** Prisma error when creating `generation_jobs`  
**Check:**

```bash
cd server
npx prisma db push
# or
npx prisma migrate dev
```

**Fix:** Ensure `generation_jobs` table exists in database

#### Issue C: No AI Providers Configured

**Symptom:** "No AI providers configured" in logs  
**Check:** `server/.env` file has at least one of:

```env
GROQ_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
```

**Fix:** Add API keys (see QUICK_START_FREE_AI.md for free keys)

#### Issue D: Text Extraction Failed

**Symptom:** Error before flashcard generation starts  
**Check:** Frontend logs - did text extraction succeed?  
**Look for:** `✅ Auto-extracted X words`

**Fix:** Ensure PDF/document upload and extraction working

### 4. Frontend Check

Add console logging in the frontend:

```typescript
// In handleGenerateFlashcards, before calling API:
console.log("🔍 About to generate flashcards with:", {
  textLength: extractedText.length,
  deckTitle: file.title,
  maxCards: flashcardOptions.maxCards,
  difficultyLevel: flashcardOptions.difficultyLevel,
});
```

### 5. Network Check

Open Browser DevTools → Network tab:

1. Click "Generate Flashcards"
2. Find the `/api/documents/generate-flashcards` request
3. Check:
   - **Request Headers:** Is `Cookie` header present?
   - **Request Payload:** Is `text` field populated?
   - **Response:** What's the exact error message?

## Expected Log Flow (Success Case)

```
📥 FULL REQUEST BODY: {
  "text": "Magnetic Disk...",
  "deckTitle": "Test Flashcards",
  "maxCards": 10,
  "difficultyLevel": "medium"
}
👤 User from req.user: { id: 1, email: 'test@example.com' }
📥 Received flashcard generation request: {
  hasText: true,
  textLength: 1234,
  documentId: undefined,
  deckTitle: 'Test Flashcards',
  maxCards: 10,
  difficultyLevel: 'medium',
  userId: 1,
  hasUser: true
}
📝 Creating generation job for user: 1
✅ Generation job created: 42
🎯 Starting flashcard generation...
📊 Generation parameters: {
  textLength: 1234,
  maxCards: 10,
  difficultyLevel: 'medium',
  hasGroq: true,
  hasHuggingFace: false
}
🚀 Generating 10 medium flashcards with Groq (FREE)...
✅ Successfully generated 10 flashcards with Groq
```

## Quick Fix Checklist

- [ ] Backend server is running (`npm run dev` in server/)
- [ ] User is logged in on frontend
- [ ] At least one AI provider configured (GROQ_API_KEY or HUGGINGFACE_API_KEY)
- [ ] Database schema is up to date (`npx prisma db push`)
- [ ] JWT middleware is applied to `/api/documents/generate-flashcards` route
- [ ] Text extraction is working (check frontend console for "✅ Auto-extracted")
- [ ] Browser cookies are enabled
- [ ] Request includes authentication cookies

## Next Steps

1. **Start backend server with logging**
2. **Try generating flashcards**
3. **Check backend console** for the exact error
4. **Share the backend logs** with the error details

The enhanced logging will show exactly where the 500 error occurs!
