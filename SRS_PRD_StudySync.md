# Software Requirements Specification (SRS) / Product Requirements Document (PRD)

## StudySync - Academic Study Platform

**Document Version:** 1.0  
**Date:** December 24, 2025  
**Classification:** Internal / Stakeholder-Ready  
**Prepared By:** Technical Documentation Team

---

## Executive Summary

**StudySync** is a comprehensive SaaS academic study platform designed to revolutionize how students learn, collaborate, and manage their educational resources. The platform combines evidence-based learning methodologies (spaced repetition flashcards) with modern collaboration features (study buddies, note sharing), AI-powered tools (content summarization, podcast generation), and campus infrastructure integration (library room booking).

The platform targets university students seeking an integrated study ecosystem. Built on a modern Next.js 15 + Express.js stack with PostgreSQL/Prisma, it is currently deployed on Vercel (frontend) and Render (backend), serving the BRAC University community and beyond. The codebase demonstrates production-ready patterns including JWT-based authentication, real-time communication via Socket.io/Pusher, file storage through Supabase, and AI integration via OpenAI/LangChain APIs.

**Key Metrics Inferred from Codebase:**
- **Database Schema:** 30+ Prisma models covering users, flashcards, notes, reservations, courses, and analytics
- **API Endpoints:** 15+ route modules with RESTful design patterns
- **File Types Supported:** PDF, DOCX, TXT (up to 50MB)
- **Deployment:** Production URLs at `study-sync-client.vercel.app` and `study-sync-server-sigma.vercel.app`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Functional Requirements](#2-functional-requirements)
3. [Non-Functional Requirements](#3-non-functional-requirements)
4. [Technical Stack](#4-technical-stack)
5. [Database Architecture](#5-database-architecture)
6. [Assumptions & Constraints](#6-assumptions--constraints)
7. [Version Highlights](#7-version-highlights)
8. [Feature Priority Matrix](#8-feature-priority-matrix)
9. [Acceptance Criteria & Test Cases](#9-acceptance-criteria--test-cases)
10. [Security, Scalability & Performance](#10-security-scalability--performance)
11. [Technical Appendix](#11-technical-appendix)

---

## 1. Project Overview

### 1.1 Product Vision

StudySync aims to become the complete academic study companion for university students by integrating:
- **Intelligent Learning:** Spaced repetition algorithms for optimized knowledge retention
- **Collaborative Features:** Peer connections, note sharing, and course communities
- **AI Augmentation:** Automated flashcard generation, content summarization, PDF-to-podcast conversion
- **Campus Integration:** Library room and seat booking with real-time availability

### 1.2 Target Audience

| Segment | Description | Primary Use Cases |
|---------|-------------|-------------------|
| **University Students** | Primary users seeking study tools | Flashcards, notes, podcast generation |
| **Study Groups** | Teams collaborating on courses | Buddy matching, library booking |
| **Academic Institutions** | Universities deploying platform | Room management, analytics |

### 1.3 Product Scope

**In Scope:**
- User authentication and profile management
- Flashcard creation, study sessions with spaced repetition
- Note upload, sharing, and discovery
- PDF-to-podcast audio generation
- Study buddy matching and chat
- Library room/seat booking system
- Course management and reviews
- Gamification (XP, levels, streaks)

**Out of Scope (Future Roadmap per README.md L574-L600):**
- Mobile native applications (planned Q2 2025)
- Video lecture processing
- VR study environments
- Blockchain certificates

### 1.4 System Context

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUDYSYNC SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Next.js    │────▶│   Express    │────▶│  PostgreSQL  │    │
│  │   Frontend   │     │    Server    │     │   (Prisma)   │    │
│  │  (Vercel)    │     │   (Render)   │     │              │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                    │             │
│         ▼                    ▼                    │             │
│  ┌──────────────┐     ┌──────────────┐           │             │
│  │   Supabase   │     │   OpenAI /   │           │             │
│  │   Storage    │     │  LangChain   │           │             │
│  └──────────────┘     └──────────────┘           │             │
│         │                    │                    │             │
│         ▼                    ▼                    │             │
│  ┌──────────────┐     ┌──────────────┐           │             │
│  │   Pusher     │     │  Edge TTS    │           │             │
│  │  (Realtime)  │     │  (Podcast)   │           │             │
│  └──────────────┘     └──────────────┘           │             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Functional Requirements

### 2.1 Authentication & User Management (FR-AUTH)

| ID | Requirement | Implementation Reference |
|----|-------------|--------------------------|
| FR-AUTH-01 | User registration with email, password, department, and semester | `server/routes/auth.js` → `AuthController.register` |
| FR-AUTH-02 | User login with JWT token issuance via HTTP-only cookies | `server/routes/auth.js:11` → `AuthController.login` |
| FR-AUTH-03 | Session validation endpoint for SPA auth state | `server/routes/auth.js:14-17` → `validateSession` |
| FR-AUTH-04 | Profile update (name, department, semester, bio, CGPA, profile picture) | `server/routes/auth.js:20-24` → `updateProfile` |
| FR-AUTH-05 | Secure logout with cookie clearing | `server/routes/auth.js:18` → `AuthController.logout` |

**Database Schema Reference:**
```prisma
// server/prisma/schema.prisma L538-L576
model users {
  id                  Int       @id @default(autoincrement())
  name                String    @db.VarChar(255)
  email               String    @unique @db.VarChar(255)
  password_hash       String    @db.VarChar(255)
  semester            Int?
  department          String    @db.VarChar(255)
  profile_picture_url String?   @db.VarChar(500)
  bio                 String?
  cgpa                Float?
  created_at          DateTime? @default(now())
  // ... relations
}
```

### 2.2 Flashcard System (FR-FLASH)

| ID | Requirement | Implementation Reference |
|----|-------------|--------------------------|
| FR-FLASH-01 | Create flashcard decks (manual or AI-generated) | `server/routes/flashcards.js:32` → `saveFlashcardDeck` |
| FR-FLASH-02 | AI-powered flashcard generation from Q&A data | `server/routes/flashcards.js:8-12` → `generateFlashcards` |
| FR-FLASH-03 | View user's flashcard decks with card counts | `server/routes/flashcards.js:15-19` → `getUserFlashcardDecks` |
| FR-FLASH-04 | Study session with spaced repetition algorithm | `client/components/StudyFlashcards.tsx` → `selectDailySession` |
| FR-FLASH-05 | Card progress tracking (interval, ease factor, review count) | Schema: `card_progress` model (L65-91) |
| FR-FLASH-06 | Delete flashcard decks | `server/routes/flashcards.js:38-42` → `deleteFlashcardDeck` |

**Spaced Repetition Algorithm:**
- Implementation: `client/lib/learning.ts` → `scheduleNextReview`, `selectDailySession`
- Based on SuperMemo SM-2 variant with configurable parameters
- Database support via `repetition_algorithms` model (schema L355-368)

**Gamification Features:**
- XP system: `client/lib/learning.ts` → `calculateExperience`
- Levels: 100 XP per level (`client/components/StudyFlashcards.tsx:34`)
- Streaks: `updateStreakData`, `getStreakData` functions

### 2.3 Notes Management (FR-NOTES)

| ID | Requirement | Implementation Reference |
|----|-------------|--------------------------|
| FR-NOTES-01 | Upload notes (PDF, DOCX, TXT up to 50MB) | `server/routes/notes.js:40-49` → `upload.single('file')` |
| FR-NOTES-02 | Browse all public/course notes with filtering | `server/routes/notes.js:36` → `getAllNotes` |
| FR-NOTES-03 | Download note files | `server/routes/notes.js:38` → `downloadNote` |
| FR-NOTES-04 | Like/unlike notes | `server/routes/notes.js:54` → `toggleLike` |
| FR-NOTES-05 | Add comments to notes | Schema: `note_comments` model (L280-292) |
| FR-NOTES-06 | Visibility controls (public, private, course_only) | Schema: `note_visibility` enum (L598-602) |

**File Upload Configuration:**
```javascript
// server/routes/notes.js L10-30
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: /* PDF, DOCX, TXT only */
});
```

### 2.4 PDF-to-Podcast Generation (FR-PODCAST)

| ID | Requirement | Implementation Reference |
|----|-------------|--------------------------|
| FR-PODCAST-01 | Create podcast from text content | `server/routes/podcastRoutes.js:14-47` → `POST /` |
| FR-PODCAST-02 | List user's podcasts | `server/routes/podcastRoutes.js:49-72` → `GET /` |
| FR-PODCAST-03 | Check podcast by file ID | `server/routes/podcastRoutes.js:74-90` → `GET /file/:fileId` |
| FR-PODCAST-04 | Stream/download audio | `server/services/podcastGenerationService.js` |
| FR-PODCAST-05 | Three-state workflow (pending → ready/failed) | Schema: `podcasts` table (COPY_THIS_SQL.sql) |

**TTS Implementation (December 22, 2025 Migration):**
- Migrated from Python `edge-tts` CLI to `edge-tts-universal` npm package
- Reference: `server/services/edgeTtsService.js` (refactored)
- Voice selection: `getVoiceForLanguage(lang)` function
- Audio format: MP3 via FFmpeg processing

**Podcast Player:**
- Component: `client/components/PodcastPlayer.tsx`
- Features: Chapter navigation, playback speed, volume control, time seeking

### 2.5 Study Buddies (FR-BUDDY)

| ID | Requirement | Implementation Reference |
|----|-------------|--------------------------|
| FR-BUDDY-01 | Browse study buddies (peers/mentors) with search | `server/routes/buddies.js:13-16` → `getBuddies` |
| FR-BUDDY-02 | Create connection request (peer/mentor type) | `server/routes/buddies.js:18-20` → `createConnection` |
| FR-BUDDY-03 | View pending connection requests | `server/routes/buddies.js:22-23` → `getPendingConnections` |
| FR-BUDDY-04 | Accept/reject connection invitations | `server/routes/buddies.js:28-30` → `respondToInvitation` |
| FR-BUDDY-05 | View accepted connections | `server/routes/buddies.js:25-26` → `getAcceptedConnections` |

**Connection Model:**
```prisma
// server/prisma/schema.prisma L462-475
model user_connections {
  status       status?   @default(pending)    // pending, accepted, rejected
  request_type req_type? @default(peer)       // peer, mentor, mentee
}
```

### 2.6 Library Room Booking (FR-LIBRARY)

| ID | Requirement | Implementation Reference |
|----|-------------|--------------------------|
| FR-LIBRARY-01 | List available library rooms | `server/routes/libraryRoomsRoutes.js:6` → `listRooms` |
| FR-LIBRARY-02 | Get room details by ID | `server/routes/libraryRoomsRoutes.js:9` → `getRoomById` |
| FR-LIBRARY-03 | Create seat reservations | `server/routes/reservationsRoutes.js` (inferred) |
| FR-LIBRARY-04 | Visual seat selection with availability | `client/components/room-layout.tsx` |
| FR-LIBRARY-05 | Booking modal with date/time selection | `client/components/booking-modal.tsx` |

**Room Features (Enum):**
```prisma
enum room_features {
  projector, whiteboard, computer, wifi, air_conditioning, power_outlets
}
```

### 2.7 Course Management (FR-COURSE)

| ID | Requirement | Implementation Reference |
|----|-------------|--------------------------|
| FR-COURSE-01 | Browse available courses | `server/routes/courses.js` → course listing |
| FR-COURSE-02 | Enroll in courses | Schema: `user_courses` model (L477-492) |
| FR-COURSE-03 | Submit course reviews | Schema: `course_reviews` model (L116-134) |
| FR-COURSE-04 | View course reviews with ratings | `server/routes/revs.js` → review routes |

### 2.8 Chat & Real-time Features (FR-CHAT)

| ID | Requirement | Implementation Reference |
|----|-------------|--------------------------|
| FR-CHAT-01 | Send direct messages | Schema: `chat_messages` model (L104-114) |
| FR-CHAT-02 | Real-time message delivery | `server/server.js:37-43` → Pusher initialization |
| FR-CHAT-03 | Message read status tracking | Schema: `is_read` field in `chat_messages` |

**Real-time Stack:**
- Pusher for pub/sub messaging (`pusher` npm package)
- Socket.io-client on frontend for bidirectional communication

### 2.9 AI Features (FR-AI)

| ID | Requirement | Implementation Reference |
|----|-------------|--------------------------|
| FR-AI-01 | AI-powered content summarization | `server/routes/summary.js` → `summaryRoutes` |
| FR-AI-02 | Automatic flashcard generation from documents | `server/routes/generation.js` → `generationRoutes` |
| FR-AI-03 | Floating AI chat assistant | `client/components/floating-chat.tsx` |

**AI Stack:**
- OpenAI API: GPT models for text generation
- LangChain: Document processing pipeline (`@langchain/community`, `@langchain/core`)
- Anthropic SDK: Alternative AI provider (`@anthropic-ai/sdk`)

### 2.10 User Statistics & Gamification (FR-STATS)

| ID | Requirement | Implementation Reference |
|----|-------------|--------------------------|
| FR-STATS-01 | Get user statistics | `server/routes/stats.js:20` → `getUserStats` |
| FR-STATS-02 | Update stats after study session | `server/routes/stats.js:30` → `updateUserStats` |
| FR-STATS-03 | Track study streaks | Schema: `user_stats` model (L507-526) |

**Stats Model Fields:**
- `total_cards_created`, `total_decks_created`, `total_notes_processed`
- `total_study_time_minutes`, `total_cards_reviewed`
- `current_study_streak_days`, `longest_study_streak_days`
- `overall_accuracy`, `cards_mastered`, `cards_learning`, `cards_new`

---

## 3. Non-Functional Requirements

### 3.1 Performance Requirements

| ID | Requirement | Target | Implementation Evidence |
|----|-------------|--------|------------------------|
| NFR-PERF-01 | API response time | < 200ms | Express.js with Prisma ORM |
| NFR-PERF-02 | Page load time | < 3s (LCP) | Next.js 15 with SSR/SSG |
| NFR-PERF-03 | File upload progress feedback | Real-time | `client/components/upload-notes.tsx` → `uploadProgress` state |
| NFR-PERF-04 | Database query optimization | Indexed queries | Schema indexes (e.g., `idx_notes_user_id`, `idx_users_email`) |

### 3.2 Scalability Requirements

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-SCALE-01 | Horizontal backend scaling | Stateless Express.js with external session storage |
| NFR-SCALE-02 | CDN for static assets | Vercel Edge Network |
| NFR-SCALE-03 | Database connection pooling | Prisma with `DATABASE_URL` + `DIRECT_URL` (schema L4-7) |

### 3.3 Availability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-AVAIL-01 | System uptime | 99.5% |
| NFR-AVAIL-02 | Health check endpoint | `GET /api/health` (server.js L131-138) |
| NFR-AVAIL-03 | Graceful degradation | Auth context loading states |

### 3.4 Security Requirements

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-SEC-01 | Password hashing | bcryptjs with salt (server/services/authService.js) |
| NFR-SEC-02 | JWT in HTTP-only cookies | `server/middleware/jwtCookieMiddleware.js` |
| NFR-SEC-03 | CORS protection | Whitelist of allowed origins (server.js L11-36) |
| NFR-SEC-04 | SQL injection prevention | Prisma parameterized queries |
| NFR-SEC-05 | Input validation | Zod schemas (client/package.json) |
| NFR-SEC-06 | File type validation | MIME type checking (notes.js L21-32) |

### 3.5 Usability Requirements

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-USE-01 | Mobile responsiveness | Responsive components (changelog: December 24, 2025) |
| NFR-USE-02 | Accessible components | Radix UI primitives |
| NFR-USE-03 | Toast notifications | Sonner library |
| NFR-USE-04 | Loading states | Skeleton loaders, spinners |

### 3.6 Maintainability Requirements

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-MAINT-01 | TypeScript adoption | Strict typing in client code |
| NFR-MAINT-02 | Component library | Shadcn/UI + Radix primitives |
| NFR-MAINT-03 | Database migrations | Prisma migrations (server/migrations/) |
| NFR-MAINT-04 | Automated testing | Jest configuration (client/jest.config.js) |

---

## 4. Technical Stack

### 4.1 Frontend Stack

| Technology | Version | Purpose | Source |
|------------|---------|---------|--------|
| **Next.js** | 15.2.8 | React framework with SSR | client/package.json:46 |
| **React** | 19 | UI library | client/package.json:48 |
| **TypeScript** | 5.x | Type safety | client/package.json:69 |
| **Tailwind CSS** | 4.1.9 | Utility-first CSS | client/package.json:68 |
| **Radix UI** | Various | Accessible primitives | client/package.json:8-34 |
| **Axios** | 1.11.0 | HTTP client | client/package.json:36 |
| **Socket.io-client** | 4.8.1 | Real-time communication | client/package.json:51 |
| **React Hook Form** | 7.60.0 | Form management | client/package.json:50 |
| **Zod** | 3.25.67 | Schema validation | client/package.json:55 |
| **Recharts** | 2.15.4 | Data visualization | client/package.json:53 |

### 4.2 Backend Stack

| Technology | Version | Purpose | Source |
|------------|---------|---------|--------|
| **Node.js** | 22 | JavaScript runtime | README.md |
| **Express.js** | 5.2.1 | Web framework | server/package.json:20 |
| **Prisma** | 6.13.0 | ORM | server/package.json:32 |
| **PostgreSQL** | 13+ | Relational database | schema.prisma:5-8 |
| **JWT** | 9.0.3 | Authentication | server/package.json:26 |
| **bcryptjs** | 3.0.3 | Password hashing | server/package.json:13 |
| **Multer** | 2.0.2 | File uploads | server/package.json:28 |
| **Pusher** | 5.2.0 | Real-time messaging | server/package.json:33 |
| **FFmpeg** | Static | Audio processing | server/package.json:21-22 |

### 4.3 AI & ML Stack

| Technology | Version | Purpose | Source |
|------------|---------|---------|--------|
| **OpenAI** | 4.62.1 | GPT API access | package.json:4 |
| **LangChain** | 0.3.x | Document processing | package.json:2-3 |
| **Anthropic SDK** | 0.71.2 | Claude API access | server/package.json:12 |
| **edge-tts-universal** | 1.3.3 | Text-to-speech | server/package.json:18 |
| **pdf-parse** | 1.1.1 | PDF text extraction | server/package.json:30 |
| **Mammoth** | 1.10.0 | DOCX processing | server/package.json:27 |

### 4.4 Infrastructure Stack

| Technology | Purpose | Source |
|------------|---------|--------|
| **Vercel** | Frontend hosting & CDN | client/vercel.json |
| **Render** | Backend hosting | server.js:14-16 (URL) |
| **Supabase** | File storage & secondary DB | server/package.json:14 |
| **PostgreSQL** | Primary database | schema.prisma:5-8 |

---

## 5. Database Architecture

### 5.1 Core Entity Models

```
┌──────────────────────────────────────────────────────────────────┐
│                      DATABASE ENTITY DIAGRAM                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────┐    ┌──────────────┐    ┌───────────────┐            │
│  │  users  │───▶│ flashcard_   │───▶│  flashcards   │            │
│  │         │    │    decks     │    │               │            │
│  └────┬────┘    └──────────────┘    └───────────────┘            │
│       │                                     │                     │
│       │         ┌──────────────┐    ┌───────────────┐            │
│       ├────────▶│    notes     │───▶│ ai_summaries  │            │
│       │         └──────────────┘    └───────────────┘            │
│       │                │                                          │
│       │         ┌──────────────┐    ┌───────────────┐            │
│       ├────────▶│ reservations │───▶│   seats       │            │
│       │         └──────────────┘    └───────────────┘            │
│       │                │                    │                     │
│       │         ┌──────────────┐    ┌───────────────┐            │
│       │         │library_rooms │───▶│(room features)│            │
│       │         └──────────────┘    └───────────────┘            │
│       │                                                           │
│       │         ┌──────────────┐    ┌───────────────┐            │
│       ├────────▶│user_connections│   │ chat_messages │            │
│       │         └──────────────┘    └───────────────┘            │
│       │                                                           │
│       │         ┌──────────────┐    ┌───────────────┐            │
│       └────────▶│ user_courses │───▶│   courses     │            │
│                 └──────────────┘    └───────────────┘            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Key Model Counts

| Model Category | Models | Reference |
|----------------|--------|-----------|
| User Management | `users`, `user_preferences`, `user_stats`, `user_activity`, `user_connections`, `user_courses` | schema.prisma L477-576 |
| Flashcard System | `flashcard_decks`, `flashcards`, `flashcard_options`, `flashcard_tags`, `card_progress`, `card_reviews`, `study_sessions` | schema.prisma L185-243, L400-432 |
| Notes System | `notes`, `note_comments`, `note_interactions`, `ai_summaries`, `document_chunks`, `extracted_concepts` | schema.prisma L173-178, L280-325 |
| Audio/Podcast | `audio_content`, `audio_playlists`, `playlist_items`, `brainrot_sessions` | schema.prisma L25-68 |
| Library System | `library_rooms`, `seats`, `reservations` | schema.prisma L269-278, L370-400 |
| Courses | `courses`, `course_reviews` | schema.prisma L116-159 |

### 5.3 Database Indexes

| Index | Table | Purpose |
|-------|-------|---------|
| `idx_users_email` | users | Fast login lookup |
| `idx_users_department` | users | Department filtering |
| `idx_notes_user_id` | notes | User's notes retrieval |
| `idx_notes_course_id` | notes | Course-based filtering |
| `idx_notes_visibility` | notes | Visibility filtering |
| `idx_notes_tags` (GIN) | notes | Full-text tag search |
| `idx_flashcards_next_review` | card_progress | Due card selection |
| `idx_reservations_datetime` | reservations | Time-based queries |

---

## 6. Assumptions & Constraints

### 6.1 Assumptions

| ID | Assumption | Impact |
|----|------------|--------|
| A-01 | Users have modern browsers (Chrome, Firefox, Safari, Edge) | No IE11 support required |
| A-02 | University students have stable internet connectivity | Real-time features prioritized |
| A-03 | English is primary language | UI and AI features in English |
| A-04 | File uploads are educational documents | 50MB limit appropriate |
| A-05 | OpenAI API availability | AI features depend on external service |
| A-06 | Supabase storage reliability | File access depends on Supabase uptime |

### 6.2 Technical Constraints

| ID | Constraint | Mitigation |
|----|------------|------------|
| C-01 | Vercel serverless function timeout (10-60s) | Long operations handled by backend server |
| C-02 | Supabase storage egress limits | CDN caching for frequently accessed files |
| C-03 | OpenAI API rate limits | Queue-based processing for AI features |
| C-04 | PostgreSQL connection limits | Prisma connection pooling |
| C-05 | Free tier Render hosting (cold starts) | Health check endpoints, warm-up scripts |

### 6.3 Business Constraints

| ID | Constraint | Details |
|----|------------|---------|
| BC-01 | MIT License | Open source, no proprietary restrictions |
| BC-02 | BRAC University primary deployment | Initial feature focus on university needs |
| BC-03 | Student development team | Development capacity considerations |

---

## 7. Version Highlights

### Release Timeline (Extracted from changelog.md)

#### December 24, 2025 - Mobile Responsiveness Release

**Summary:** Major mobile UI/UX improvements across key pages and navigation components.

**Changes:**
| Category | Files Modified | Key Changes |
|----------|---------------|-------------|
| View Notes Page | `client/app/view-notes/[id]/page.tsx` | Stacked layout, responsive iframe height, adaptive typography |
| Library Page | `client/app/library/page.tsx` | Stacked filters, responsive room grid (1→3 columns) |
| Booking Modal | `client/components/booking-modal.tsx` | Full-screen mobile modal, 2-column grid |
| Room Layout | `client/components/room-layout.tsx` | Adaptive container height, smaller mobile labels |
| Mobile Navigation | `client/components/mobile-nav.tsx` (new) | Bottom navigation bar with Dashboard, Library, Profile |
| Media Query Hook | `client/hooks/use-media-query.ts` (new) | TypeScript media query hook |
| Responsive Nav | `client/components/responsive-nav.tsx` (new) | Conditional desktop/mobile navigation |
| Header Gate | `client/components/header-gate.tsx` | Integrated responsive navigation |

**Styling:** Consistent with THEME system using primary brand color (#191265) and glass effects.

---

#### December 22, 2025 - Edge TTS Migration

**Summary:** Migrated podcast TTS from Python to pure Node.js for simplified deployment.

**Changes:**
| Category | Details |
|----------|---------|
| Dependency Change | Python `edge-tts` CLI → `edge-tts-universal` npm package |
| New Dependencies | `edge-tts-universal@^1.3.3`, `ffprobe-static` |
| Files Modified | `server/services/edgeTtsService.js` (refactored) |
| Backup Created | `server/services/edgeTtsService.old.js` |
| Test Suite | `server/services/test-edge-tts.js` (all tests passing) |

**Benefits:**
- Eliminated Python runtime dependency
- Faster performance (pure JavaScript)
- Simplified deployment (Node.js only)
- Better maintainability
- Verified audio generation (4.8s test audio)

**Migration Status:** ✅ Complete and production-ready

**Documentation:** `EDGE_TTS_MIGRATION.md`

---

## 8. Feature Priority Matrix

### MoSCoW Prioritization

| Priority | Feature | Status | Evidence |
|----------|---------|--------|----------|
| **MUST** | User Authentication | ✅ Implemented | `server/routes/auth.js` |
| **MUST** | Flashcard CRUD | ✅ Implemented | `server/routes/flashcards.js` |
| **MUST** | Notes Upload/Browse | ✅ Implemented | `server/routes/notes.js` |
| **MUST** | Spaced Repetition Algorithm | ✅ Implemented | `client/lib/learning.ts` |
| **MUST** | Mobile Responsiveness | ✅ Implemented | changelog December 24, 2025 |
| **SHOULD** | PDF-to-Podcast | ✅ Implemented | `server/routes/podcastRoutes.js` |
| **SHOULD** | Study Buddies | ✅ Implemented | `server/routes/buddies.js` |
| **SHOULD** | Library Booking | ✅ Implemented | `server/routes/libraryRoomsRoutes.js` |
| **SHOULD** | AI Summarization | ✅ Implemented | `server/routes/summary.js` |
| **SHOULD** | Gamification (XP/Levels) | ✅ Implemented | `client/lib/learning.ts` |
| **SHOULD** | Real-time Chat | ✅ Implemented | `server/routes/chats.js` |
| **COULD** | Course Reviews | ✅ Implemented | `server/routes/revs.js` |
| **COULD** | AI Flashcard Generation | ✅ Implemented | `server/routes/generation.js` |
| **COULD** | Floating AI Chat | ✅ Implemented | `client/components/floating-chat.tsx` |
| **WON'T** (v1) | Mobile Native App | Planned Q2 2025 | README.md L576 |
| **WON'T** (v1) | Video Lecture Processing | Planned Q2 2025 | README.md L579 |
| **WON'T** (v1) | VR Study Rooms | Planned Q4 2025 | README.md L591 |
| **WON'T** (v1) | Blockchain Certificates | Planned Q4 2025 | README.md L592 |

---

## 9. Acceptance Criteria & Test Cases

### 9.1 Authentication Module

#### AC-AUTH-01: User Registration

**Acceptance Criteria:**
- Users can register with valid email, password (8+ characters), name, and department
- Duplicate emails are rejected with appropriate error message
- JWT token is issued in HTTP-only cookie upon successful registration
- User profile is created in database

**Test Cases:**

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| TC-AUTH-01-01 | Valid registration data | 201 Created, JWT cookie set |
| TC-AUTH-01-02 | Duplicate email | 400 Bad Request, error message |
| TC-AUTH-01-03 | Missing required fields | 400 Bad Request, validation error |
| TC-AUTH-01-04 | Password < 8 characters | 400 Bad Request, password requirement error |

**API Contract:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "securePass123",
  "department": "Computer Science",
  "semester": 6
}

--- Response 201 ---
Set-Cookie: token=eyJhbGciOiJIUzI1NiIs...; HttpOnly; Secure; Path=/
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 42,
      "name": "John Doe",
      "email": "john@university.edu",
      "department": "Computer Science"
    }
  }
}
```

---

#### AC-AUTH-02: User Login

**Acceptance Criteria:**
- Users can login with valid email and password
- Invalid credentials return 401 Unauthorized
- JWT token refreshed in HTTP-only cookie
- Last login timestamp updated

**API Contract:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@university.edu",
  "password": "securePass123"
}

--- Response 200 ---
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... }
  }
}
```

---

### 9.2 Flashcard Module

#### AC-FLASH-01: Create Flashcard Deck

**Acceptance Criteria:**
- Authenticated users can create decks with title and description
- Decks can contain 0+ flashcards initially
- Creation method tracked (manual vs AI-generated)
- Deck appears in user's deck list

**API Contract:**
```http
POST /api/flashcards/save
Authorization: Cookie token
Content-Type: application/json

{
  "title": "Calculus Chapter 1",
  "description": "Limits and Derivatives",
  "flashcards": [
    {
      "question": "What is a limit?",
      "answer": "The value that a function approaches...",
      "type": "basic"
    }
  ]
}

--- Response 201 ---
{
  "success": true,
  "data": {
    "deck": {
      "id": 123,
      "title": "Calculus Chapter 1",
      "totalCards": 1
    }
  }
}
```

---

#### AC-FLASH-02: Study Session with Spaced Repetition

**Acceptance Criteria:**
- System selects cards due for review based on next_review_date
- New cards limited by daily_study_goal preference
- User responses (again, hard, good, easy) update card intervals
- XP awarded for correct answers
- Streak updated on completion

---

### 9.3 Notes Module

#### AC-NOTES-01: Upload Note File

**Acceptance Criteria:**
- Accept PDF, DOCX, TXT files up to 50MB
- Require title, course selection, visibility setting
- File stored in Supabase Storage
- Note record created in database
- Return file URL for viewing

**API Contract:**
```http
POST /api/notes/upload
Authorization: Cookie token
Content-Type: multipart/form-data

file: [Binary data]
title: "Lecture 1 Notes"
courseId: 15
description: "Introduction to Algorithms"
visibility: "public"

--- Response 201 ---
{
  "success": true,
  "data": {
    "note": {
      "id": 456,
      "title": "Lecture 1 Notes",
      "file_url": "https://supabase.co/.../file.pdf"
    }
  }
}
```

---

### 9.4 Podcast Module

#### AC-PODCAST-01: Generate Podcast from Text

**Acceptance Criteria:**
- Accept text content with minimum word count (inferred: 50 words)
- Create podcast record with 'pending' status
- Background task generates audio via Edge TTS
- Status updates to 'ready' or 'failed'
- Audio URL provided when ready

**API Contract:**
```http
POST /api/server/podcasts
Content-Type: application/json

{
  "userId": "42",
  "text": "This is the content to convert to speech...",
  "title": "Chapter 1 Summary",
  "lang": "en"
}

--- Response 201 ---
{
  "success": true,
  "podcastId": "uuid-here",
  "status": "pending",
  "metadata": {
    "charCount": 2500,
    "wordCount": 450,
    "estimatedDurationMinutes": 3.5
  }
}
```

---

### 9.5 Test File Locations

| Module | Test File | Status |
|--------|-----------|--------|
| Flashcard UI | `client/__tests__/StudyFlashcards.test.tsx` | Exists |
| Text Chunker | `server/__tests__/textChunker.test.ts` | Exists |
| Edge TTS | `server/services/test-edge-tts.js` | Exists |

---

## 10. Security, Scalability & Performance

### 10.1 Security Analysis

#### Current Security Measures

| Category | Implementation | File Reference |
|----------|---------------|----------------|
| **Authentication** | JWT with HTTP-only cookies | `server/middleware/jwtCookieMiddleware.js` |
| **Password Storage** | bcryptjs hashing | `server/services/authService.js` |
| **CORS** | Whitelist-based origin control | `server/server.js:45-73` |
| **SQL Injection** | Prisma parameterized queries | All controllers |
| **File Validation** | MIME type + size checks | `server/routes/notes.js:10-32` |
| **Input Validation** | Zod schemas (client-side) | `client/package.json:55` |

#### Identified Risks & Remediations

| Risk | Severity | Current State | Remediation |
|------|----------|---------------|-------------|
| **R-01:** No rate limiting | Medium | Not implemented | Add `express-rate-limit` middleware |
| **R-02:** JWT secret management | Medium | Environment variable | Use secrets management service (AWS Secrets Manager) |
| **R-03:** No HTTPS enforcement in code | Low | Relies on hosting provider | Add `helmet` middleware with HSTS |
| **R-04:** Error messages may leak info | Low | Generic messages mostly | Audit error responses for sensitive data |
| **R-05:** No CSP headers | Low | Not configured | Add Content-Security-Policy via helmet |

**Recommended Actions:**
```bash
npm install express-rate-limit helmet
```

```javascript
// Recommended additions to server.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

app.use(helmet());
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

---

### 10.2 Scalability Analysis

#### Current Architecture

| Component | Scalability Pattern | Notes |
|-----------|---------------------|-------|
| **Frontend** | CDN + Edge (Vercel) | Auto-scales |
| **Backend** | Single instance (Render) | Manual scaling |
| **Database** | Managed PostgreSQL | Connection pooling via Prisma |
| **Storage** | Supabase (S3-compatible) | Auto-scales |
| **Real-time** | Pusher (managed) | Auto-scales |

#### Bottleneck Analysis

| Bottleneck | Current Limit | Scaling Solution |
|------------|---------------|------------------|
| Backend server | Single instance | Deploy to container orchestration (K8s, ECS) |
| Database connections | Prisma default pool | Configure pool size, add read replicas |
| AI API calls | OpenAI rate limits | Implement queue-based processing |
| File storage | Supabase free tier | Upgrade plan or migrate to S3 |

**Inferred from Code:**
- Database uses connection pooling (`DIRECT_URL` for migrations, `DATABASE_URL` for application)
- No caching layer visible (recommend Redis for session/query caching)

---

### 10.3 Observability Analysis

#### Current State

| Category | Implementation | Evidence |
|----------|---------------|----------|
| **Logging** | `console.log/error` | Throughout codebase |
| **Health Check** | `/api/health` endpoint | `server/server.js:131-138` |
| **Error Tracking** | Not configured | No Sentry/equivalent found |
| **Metrics** | Not configured | No Prometheus/equivalent found |

#### Recommended Improvements

```javascript
// Recommended: Add structured logging
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Recommended: Add error tracking
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

### 10.4 Performance Considerations

#### Identified Optimizations

| Area | Current State | Optimization |
|------|---------------|--------------|
| **Next.js Images** | `unoptimized: true` | Enable image optimization for production |
| **API Responses** | Full objects | Implement pagination consistently |
| **Database Queries** | Basic Prisma | Add database indexes (partially done) |
| **Static Assets** | Vercel CDN | Already optimized |
| **Build Errors** | Ignored in config | Fix TypeScript/ESLint errors |

**From next.config.mjs:**
```javascript
// Current configuration ignores build errors - not recommended for production
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true }
```

**Recommendation:** Fix underlying type/lint errors rather than suppressing them.

---

## 11. Technical Appendix

### 11.1 Data Extraction Commands

```bash
# List all API routes
grep -r "router\.\(get\|post\|put\|delete\)" server/routes/ --include="*.js"

# Find all Prisma models
grep "^model " server/prisma/schema.prisma

# List React components
find client/components -name "*.tsx" -type f

# Check package dependencies
cat client/package.json | jq '.dependencies'
cat server/package.json | jq '.dependencies'

# Find all API endpoints registered
grep "app.use.*api" server/server.js

# List database indexes
grep "@index\|@@index" server/prisma/schema.prisma
```

### 11.2 Key File Excerpts

#### Server Entry Point (server.js:107-128)
```javascript
// Use all routes
app.use("/api/auth", authRoutes);
app.use("/api/library-rooms", libraryRoomsRouter);
app.use("/api/seats", seatsRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/profile", profileRoutes);
app.use("/api/buddies", buddyRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/generation", generationRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/view-notes", viewNotesRoutes);
app.use("/api/server/podcasts", podcastRoutes);
```

#### Auth Middleware Pattern (jwtCookieMiddleware.js:8-25)
```javascript
const verifyTokenFromCookie = async (req, res, next) => {
  let token = null;
  
  // 1. Check Authorization header
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  
  // 2. Check cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  // ... verification logic
};
```

#### Spaced Repetition Selection (lib/learning.ts - inferred)
```typescript
function selectDailySession(flashcards: Flashcard[], config: Config): DailySession {
  // Reviews: cards where next_review_date <= today
  // News: new cards up to max_new_cards_per_day
  return { reviews: [...], news: [...] };
}
```

### 11.3 Environment Variables Required

#### Server (.env)
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
JWT_SECRET="256-bit-secret"

# External Services
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."
OPENAI_API_KEY="sk-..."

# Real-time
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="..."

# Server Config
PORT=5000
NODE_ENV="development|production"
CLIENT_URL="http://localhost:3000"
```

#### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_PRODUCTION_API_URL=https://study-sync-server-sigma.vercel.app/api
```

### 11.4 Deployment Commands

```bash
# Frontend (Vercel)
cd client && npm run build
npx vercel --prod

# Backend (PM2)
cd server
npm ci --production
npx prisma db push
pm2 start server.js --name "studysync-server"
pm2 save && pm2 startup

# Docker
docker build -t studysync-server .
docker run -p 5000:5000 --env-file .env studysync-server
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 24, 2025 | Technical Documentation Team | Initial SRS/PRD creation |

---

**End of Document**
