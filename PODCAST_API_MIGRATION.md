# Podcast API Migration Guide

## Changes Made to Fix Frontend Integration

### Issue
Frontend was calling `podcastAPI.generatePodcast()` which doesn't exist in the new API. The new implementation uses `podcastAPI.createPodcast()`.

### Files Updated

#### 1. [`client/app/assistant/files/page.tsx`](client/app/assistant/files/page.tsx)

**Old Code:**
```typescript
// ❌ OLD - Does not exist
const result = await podcastAPI.generatePodcast({
  text: qsAnsData.extractedText,
  title: `${file.title} - StudySync Podcast`,
  lang: "en",
});

if (result.success && result.episodeId) {
  // Handle demo mode vs real audio
  setPodcastData({
    episodeId: result.episodeId,
    audioUrl: result.audioUrl || "",
    // ... old structure
  });
}
```

**New Code:**
```typescript
// ✅ NEW - Correct API
const result = await podcastAPI.createPodcast({
  text: qsAnsData.extractedText,
  title: `${file.title} - StudySync Podcast`,
  userId: user.id,        // REQUIRED
  fileId: file.id,        // REQUIRED
  lang: "en",
});

if (result.success && result.podcastId) {
  // Poll for completion
  const podcast = await podcastAPI.pollPodcastStatus(result.podcastId);

  if (podcast?.status === "ready") {
    setPodcastData({
      episodeId: podcast.id,
      audioUrl: podcast.audio_url || "",
      title: podcast.title,
      // ... new structure
    });
  }
}
```

**Player Component:**
```typescript
// ❌ OLD - Removed
import PodcastPlayer from "@/components/PodcastPlayer";
import LiveTTSPlayer from "@/components/LiveTTSPlayer";

// ✅ NEW - Single native audio player
import AudioPodcastPlayer from "@/components/AudioPodcastPlayer";

// Usage:
<AudioPodcastPlayer
  audioUrl={podcastData.audioUrl}
  title={podcastData.title}
  podcastId={podcastData.episodeId}
/>
```

---

## Key Differences

### API Method Names
| Old API | New API | Notes |
|---------|---------|-------|
| `generatePodcast()` | `createPodcast()` | Creates podcast, returns immediately |
| N/A | `pollPodcastStatus()` | Poll until status is `ready` or `failed` |
| `getPodcastMetadata()` | `getPodcast()` | Get podcast by ID |
| `getEpisodesList()` | `getUserPodcasts()` | List user's podcasts |

### Response Structure
**Old:**
```typescript
{
  success: true,
  episodeId: "...",
  audioUrl: "...",      // Immediate
  duration: 180,        // Estimated
  demoMode: true,       // Flag
  chapters: [...]
}
```

**New:**
```typescript
// Create response
{
  success: true,
  podcastId: "uuid",
  status: "pending",    // State-based
  wasReduced: false,
  metadata: {
    charCount: 5000,
    wordCount: 800,
    estimatedDurationMinutes: 5.3
  }
}

// After polling completes
{
  id: "uuid",
  status: "ready",
  audio_url: "...",     // Real URL after generation
  duration: 183.45,     // Real duration from audio
  title: "...",
  // ... full podcast object
}
```

### Required Fields
**Old:**
- `text` ✅
- `title` (optional)
- `lang` (optional)

**New:**
- `text` ✅ (required)
- `userId` ✅ (required)
- `title` (optional)
- `fileId` (optional)
- `lang` (optional)

---

## State Handling

### Old Flow
1. Call `generatePodcast()`
2. Get immediate response with `demoMode: true`
3. Show player (uses Web Speech API)

### New Flow
1. Call `createPodcast()` → status: `"pending"`
2. Poll with `pollPodcastStatus()` every 3 seconds
3. Wait for status: `"ready"` or `"failed"`
4. Show player with real audio URL

**Example:**
```typescript
// Create podcast
const createResult = await podcastAPI.createPodcast({
  text: extractedText,
  title: "My Podcast",
  userId: user.id,
  fileId: file.id,
});

if (!createResult.success) {
  throw new Error(createResult.error);
}

// Show loading state
toast.info("Generating podcast...");

// Poll for completion
const podcast = await podcastAPI.pollPodcastStatus(
  createResult.podcastId,
  3000,  // Poll every 3 seconds
  100    // Max 100 attempts (5 minutes)
);

if (podcast?.status === "ready") {
  // Show player with real audio
  showPlayer(podcast.audio_url);
} else if (podcast?.status === "failed") {
  // Show error with retry button
  showError(podcast.error_message);
} else {
  // Timeout
  showError("Generation timed out");
}
```

---

## Component Changes

### Removed Components
- `PodcastPlayer.tsx` - Old player with estimated durations
- `LiveTTSPlayer.tsx` - Web Speech API player

### New Component
- `AudioPodcastPlayer.tsx` - Native HTML5 audio player

**Props:**
```typescript
interface AudioPodcastPlayerProps {
  audioUrl: string;      // Required: Supabase Storage URL
  title?: string;        // Optional: Podcast title
  podcastId?: string;    // Optional: Podcast ID
  className?: string;    // Optional: Custom styling
}
```

**Features:**
- Native `<audio>` element
- Real seeking (no simulation)
- Playback speed (0.75x - 2x)
- Volume control
- Download button
- Real duration from metadata

---

## Testing the New Flow

### 1. Extract PDF Text
```typescript
// Existing functionality - no changes
const qsAnsData = await generateQsAns(file);
```

### 2. Generate Podcast
```typescript
const result = await podcastAPI.createPodcast({
  text: qsAnsData.extractedText,
  title: file.title,
  userId: user.id,
  fileId: file.id,
});

console.log("Podcast ID:", result.podcastId);
console.log("Status:", result.status); // "pending"
```

### 3. Poll for Completion
```typescript
const podcast = await podcastAPI.pollPodcastStatus(result.podcastId);

console.log("Final status:", podcast.status); // "ready" or "failed"
console.log("Audio URL:", podcast.audio_url);
console.log("Duration:", podcast.duration); // Real seconds
```

### 4. Display Player
```tsx
{podcast.status === "ready" && (
  <AudioPodcastPlayer
    audioUrl={podcast.audio_url}
    title={podcast.title}
    podcastId={podcast.id}
  />
)}
```

---

## Error Handling

### Old Approach
```typescript
if (!result.success) {
  toast.error(result.error);
}
```

### New Approach
```typescript
// Check creation
if (!result.success) {
  toast.error(result.error);
  return;
}

// Poll and check status
const podcast = await podcastAPI.pollPodcastStatus(result.podcastId);

if (podcast?.status === "failed") {
  toast.error(podcast.error_message);
  // Show retry button
  <button onClick={() => podcastAPI.retryPodcast(podcast.id)}>
    Retry
  </button>
} else if (!podcast) {
  toast.error("Generation timed out");
}
```

---

## Common Errors

### ❌ "generatePodcast is not a function"
**Fix:** Use `createPodcast` instead

### ❌ "User authentication required"
**Fix:** Pass `userId: user.id` in the request

### ❌ "Podcast stuck in pending"
**Fix:** Check server logs, ensure Edge-TTS is installed

### ❌ "Audio URL is undefined"
**Fix:** Wait for status to be `"ready"` before accessing `audio_url`

---

## Summary of Changes

✅ **Fixed:**
- Changed `generatePodcast()` → `createPodcast()`
- Added required `userId` and `fileId` parameters
- Added polling for podcast completion
- Replaced old player components with `AudioPodcastPlayer`
- Updated response handling for new state-based architecture

✅ **Benefits:**
- Real audio files (not Web Speech API)
- Accurate durations (from audio metadata)
- Native seeking and controls
- Proper state management
- Cost-safe (Edge-TTS is free)

---

For full implementation details, see:
- [PODCAST_SETUP_GUIDE.md](PODCAST_SETUP_GUIDE.md)
- [PODCAST_IMPLEMENTATION_SUMMARY.md](PODCAST_IMPLEMENTATION_SUMMARY.md)
