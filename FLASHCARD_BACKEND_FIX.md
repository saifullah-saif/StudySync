# Flashcard Generation Backend & UX Fixes

## Issues Fixed

### 1. ❌ Backend 500 Internal Server Error

**Problem:**

- POST `/api/documents/generate-flashcards` returned generic 500 errors
- No meaningful error messages for debugging
- Crashes instead of handling edge cases gracefully

**Root Causes:**

1. Missing validation for edge cases
2. Generic error handling that didn't log details
3. No support for Q&A pairs as alternative input
4. Errors thrown without proper HTTP status codes

**Solution:**

#### Added Detailed Request Logging

```javascript
console.log("📥 FULL REQUEST BODY:", JSON.stringify(req.body, null, 2));
```

#### Accept Multiple Input Types

```javascript
const { documentId, text, deckTitle, maxCards, difficultyLevel, qaPairs } =
  req.body;

// Accept either text OR qaPairs
if (!documentId && !text && !qaPairs?.length) {
  return res.status(400).json({
    success: false,
    message: "Either documentId, text, or qaPairs is required",
    details:
      "Please provide extracted text or Q&A pairs for flashcard generation",
  });
}
```

#### Better Error Handling

```javascript
catch (error) {
  console.error("❌ Generate flashcards error:", error);
  console.error("❌ Error stack:", error.stack);

  // Return meaningful error messages, not generic 500s
  const statusCode = error.statusCode || 500;
  const errorMessage = error.message || "Failed to generate flashcards";

  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    details: {
      phase: error.phase || "unknown",
      provider: error.provider || "unknown"
    }
  });
}
```

---

### 2. ❌ ALL Files Show "Generating Flashcards..." (Global Loading State)

**Problem:**

- Clicking "Generate Flashcards" on one file showed "Generating..." on ALL files
- Dangerous UX - users couldn't tell which file was actually processing

**Root Cause:**

```typescript
// ❌ BAD: Global boolean state
const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

// Every file card checked the same boolean
{
  generatingFlashcards ? "Generating..." : "Generate Flashcards";
}
```

**Solution:**

#### Per-File Loading State

```typescript
// ✅ GOOD: Map of file IDs to loading states
const [flashcardLoadingMap, setFlashcardLoadingMap] = useState<
  Record<number, boolean>
>({});
```

#### Update Only the Clicked File

```typescript
const handleGenerateFlashcards = async (file: FileItem) => {
  try {
    // ✅ Set loading state for THIS file only
    setFlashcardLoadingMap((prev) => ({ ...prev, [file.id]: true }));

    // ... generation logic ...
  } finally {
    // ✅ Clear loading state for THIS file only
    setFlashcardLoadingMap((prev) => ({ ...prev, [file.id]: false }));
  }
};
```

#### Bind UI to Specific File

```typescript
<Button disabled={flashcardLoadingMap[file.id] || processingFiles.has(file.id)}>
  {processingFiles.has(file.id)
    ? "Extracting Text..."
    : flashcardLoadingMap[file.id]
    ? "Generating Flashcards..." // ✅ Only THIS file shows loading
    : "Generate Flashcards"}
</Button>
```

---

## Files Modified

### Backend

**server/controller/documentController.js**

- Added full request body logging
- Added support for `qaPairs` input
- Improved error messages with details
- Added development-mode stack traces
- Proper HTTP status codes (400 for validation, 500 for server errors)

### Frontend

**client/app/assistant/files/page.tsx**

- Removed: `const [generatingFlashcards, setGeneratingFlashcards]`
- Added: `const [flashcardLoadingMap, setFlashcardLoadingMap]`
- Updated: `handleGenerateFlashcards()` to use per-file state
- Updated: UI button to read `flashcardLoadingMap[file.id]`

---

## Before vs After

### Backend Error Response

#### Before

```json
{
  "success": false,
  "message": "Failed to generate flashcards"
}
```

#### After

```json
{
  "success": false,
  "message": "Either documentId, text, or qaPairs is required",
  "details": "Please provide extracted text or Q&A pairs for flashcard generation",
  "error": "Error: Missing required field\n  at generateFlashcards (documentController.js:210:15)\n  ...",
  "details": {
    "phase": "validation",
    "provider": "unknown"
  }
}
```

### Frontend Loading State

#### Before

```
File 1: [Generating Flashcards...] ❌ (even though user clicked File 3)
File 2: [Generating Flashcards...] ❌
File 3: [Generating Flashcards...] ✅ (correct)
```

#### After

```
File 1: [Generate Flashcards] ✅
File 2: [Generate Flashcards] ✅
File 3: [Generating Flashcards...] ✅ (only the clicked file)
```

---

## UX Safety Rules Implemented

✅ **Never use a single boolean for multi-item async actions**

- Each file has its own loading state in `flashcardLoadingMap`

✅ **Never show "Generating" on unrelated items**

- Only `flashcardLoadingMap[file.id]` controls the UI for that file

✅ **Every async action tied to a file uses fileId**

- `setFlashcardLoadingMap(prev => ({ ...prev, [file.id]: true }))`

✅ **Backend returns meaningful errors (not silent 500s)**

- Detailed error messages, stack traces in dev mode, proper status codes

✅ **Frontend shows per-file progress only**

- Each card independently reads its own state

---

## Testing Checklist

### Backend Error Handling

- [ ] **Test with missing text:** Send request with no `text`, `documentId`, or `qaPairs`
  - Expected: 400 error with message "Either documentId, text, or qaPairs is required"
- [ ] **Test with valid text:** Send request with extracted text
  - Expected: 200 success with flashcard deck created
- [ ] **Test with invalid documentId:** Send request with non-existent documentId
  - Expected: 404 error "Document not found or access denied"
- [ ] **Check console logs:** Verify full request body is logged
  - Expected: `📥 FULL REQUEST BODY: { ... }`

### Frontend Per-File Loading

- [ ] **Generate flashcards on File 1:** Click "Generate Flashcards" on first file
  - Expected: Only File 1 shows "Generating Flashcards..."
  - Expected: File 2, 3, 4... show "Generate Flashcards" (enabled)
- [ ] **Generate flashcards on File 3 while File 1 is processing:**
  - Expected: File 1 still shows "Generating..."
  - Expected: File 3 now shows "Generating..."
  - Expected: File 2, 4... show "Generate Flashcards" (enabled)
- [ ] **After generation completes:**
  - Expected: File reverts to "Generate Flashcards"
  - Expected: Redirects to practice session
- [ ] **Verify button state is disabled correctly:**
  - Expected: `disabled={flashcardLoadingMap[file.id] || processingFiles.has(file.id)}`
  - Expected: Button disabled only for files currently processing

### Error Recovery

- [ ] **Test network error during generation:**
  - Expected: Error toast shown
  - Expected: Loading state cleared for that file
  - Expected: Other files unaffected
- [ ] **Test backend 500 error:**
  - Expected: Detailed error message in toast
  - Expected: Console shows full error details
  - Expected: Loading state cleared

---

## API Contract

### Request Format

```typescript
POST /api/documents/generate-flashcards

{
  // Option 1: Provide extracted text
  "text": "The full extracted text from the document...",
  "deckTitle": "Chemistry Flashcards",
  "maxCards": 10,
  "difficultyLevel": "medium"
}

// OR Option 2: Provide Q&A pairs
{
  "qaPairs": [
    { "question": "What is...", "answer": "It is..." }
  ],
  "deckTitle": "Chemistry Flashcards",
  "maxCards": 10,
  "difficultyLevel": "medium"
}

// OR Option 3: Provide document ID
{
  "documentId": 123,
  "deckTitle": "Chemistry Flashcards",
  "maxCards": 10,
  "difficultyLevel": "medium"
}
```

### Response Format

```typescript
// Success
{
  "success": true,
  "message": "Successfully generated 10 flashcards",
  "data": {
    "jobId": 456,
    "deckId": 789,
    "totalCards": 10,
    "cardsCreated": 10
  }
}

// Error
{
  "success": false,
  "message": "Insufficient text content for flashcard generation",
  "details": "Text must be at least 100 characters",
  "error": "[stack trace in dev mode]",
  "details": {
    "phase": "validation",
    "provider": "unknown"
  }
}
```

---

## Future Improvements

- [ ] Add request validation middleware to centralize error handling
- [ ] Implement rate limiting per user for flashcard generation
- [ ] Add progress tracking for multi-step generation (extract → generate → save)
- [ ] Cache extracted text in database to avoid re-extraction
- [ ] Add bulk flashcard generation (select multiple files)
- [ ] Show progress bar instead of just loading spinner
- [ ] Add cancel button for long-running generations
