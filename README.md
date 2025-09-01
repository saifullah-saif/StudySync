# StudySync - Spaced Repetition Flashcard System

## Overview

StudySync is a modern flashcard application built with Next.js that implements a comprehensive spaced repetition learning system with evidence-based scheduling, gamification, and persistence.

## Features Implemented

### ✅ Professional UI Enhancements

- **Color-coded buttons**: Green for "Mark Correct", Red for "Mark Wrong", Blue for primary actions
- **Gradient backgrounds**: Professional visual design with modern aesthetics
- **Smooth transitions**: Hover effects and scaling animations
- **Consistent navbar**: Unified design across the application
- **Removed loading states**: Clean button interactions without distracting loading indicators

### ✅ Daily Streak System

- **Automatic tracking**: Daily practice sessions are automatically recorded
- **Streak maintenance**: Consecutive daily practice maintains streak count
- **Streak breaking**: Missing a day breaks the streak and resets to 0
- **Visual feedback**: Dashboard shows current streak, longest streak, and broken streak warnings
- **Real-time countdown**: Timer showing time remaining to maintain current streak
- **Practice history**: Calendar view showing all practice days with visual indicators

### 🎧 PDF → Podcast Pipeline

A unique feature that converts PDF text into audio podcasts using:

- **Free TTS**: Google TTS API for text-to-speech conversion
- **Smart Chunking**: Sentence-aware text splitting for natural audio flow
- **Audio Processing**: FFmpeg for concatenation and normalization
- **Chapter Navigation**: Built-in player with chapter jumping and download
- **Local Storage**: Content-based caching for efficient regeneration
- **University Project**: Designed for local development and demonstration

### 📊 Spaced Repetition Learning

Based on SuperMemo algorithm with modern enhancements:

### ✅ Enhanced Analytics Dashboard

- **Dynamic statistics**: Real-time display of streak, cards reviewed, accuracy, and level
- **Visual streak indicators**: Fire icons and color coding for active/broken streaks
- **Practice calendar**: Monthly view of practice history with visual day markers
- **Streak statistics**: Current streak, longest streak, total practice days, average per week
- **Progress tracking**: XP, level progression, and performance metrics

### ✅ Gamification System

- **XP calculation**: Base points + interval bonuses for correct answers
- **Level progression**: Dynamic leveling based on accumulated XP
- **Progress tracking**: Visual progress bars and level displays
- **Session statistics**: Accuracy, streak, and performance metrics
- **Achievement tracking**: Longest streak records and milestone celebrations

### ✅ Persistence & Storage

- **Dual persistence**: Backend API + localStorage fallback
- **Learning state tracking**: Interval index, next review dates, success rates
- **Session progress**: Comprehensive session data and analytics
- **API integration**: Enhanced flashcard API with learning endpoints

### ✅ Enhanced Study Experience

- **Daily sessions**: Optimized card selection for effective learning
- **Success rate display**: Per-card performance metrics
- **Learning stages**: Visual representation of mastery progress
- **Session completion**: Detailed results and continuation options

### ✅ PDF → Podcast Generation (Local Demo)

- **Text-to-Speech Conversion**: Transform extracted PDF text into high-quality audio podcasts
- **Chapter-based Structure**: Automatically splits content into manageable audio chapters
- **Local Processing**: Uses `google-tts-api` + `ffmpeg-static` for local audio generation and stitching
- **Interactive Player**: Built-in audio player with chapter navigation, speed control, and download
- **Caching System**: Content-based caching to avoid re-generating identical podcasts
- **User Consent**: Confirmation dialog ensuring users have rights to convert content to audio
- **File Integration**: Generate podcasts directly from extracted PDF text in "My Files" section

**Note**: This feature is intended for local/demo use only. Ensure you have rights to convert content to audio before generation.

## Technical Architecture

### Core Files

- **`/lib/learning.ts`**: Complete spaced repetition algorithm implementation + streak management
- **`/components/StudyFlashcards.tsx`**: Enhanced study interface with gamification and streak tracking
- **`/components/StreakHistory.tsx`**: Practice history calendar and streak analytics display
- **`/app/assistant/page.tsx`**: Updated dashboard with real-time streak statistics
- **`/lib/api.js`**: Extended API client with learning persistence and streak endpoints

### Algorithm Details

- **Scheduling Function**: `scheduleNextReview()` - Updates card learning state
- **Session Selection**: `selectDailySession()` - Selects optimal daily card set
- **Streak Management**: `updateStreakData()` - Tracks daily practice and maintains streaks
- **Streak Detection**: `checkStreakStatus()` - Identifies broken streaks and resets counters
- **XP Calculation**: Dynamic point system with interval-based bonuses
- **Level System**: Progressive difficulty and achievement tracking

### Streak System Details

1. **Daily Practice Tracking**: Each completed study session updates streak data
2. **Consecutive Day Logic**: Practicing today and tomorrow maintains streak
3. **Streak Breaking**: Missing more than 1 day automatically resets streak to 0
4. **Visual Feedback**: Dashboard shows current streak status with countdown timer
5. **Historical Data**: Calendar view displays practice history for motivation
6. **Statistics**: Tracks current streak, longest streak, total practice days, and averages

### Persistence Strategy

1. **Primary**: Backend API calls for centralized data storage
2. **Fallback**: localStorage for offline capability and reliability
3. **State Management**: Real-time updates with optimistic UI

## Usage

1. **Install Dependencies**:

   Server (for podcast generation):

   ```bash
   cd server
   npm install google-tts-api fluent-ffmpeg ffmpeg-static --legacy-peer-deps
   ```

   Client:

   ```bash
   cd client
   npm run dev
   ```

2. **Access Application**: http://localhost:3001

3. **Study Flow**:

   - Cards are automatically selected based on spaced repetition
   - Answer cards to advance through learning stages
   - Earn XP and level up based on performance
   - Track progress with detailed analytics

4. **Podcast Generation**:
   - Go to "My Files" and upload a PDF
   - Extract text from the PDF
   - Click "Generate Podcast" to create audio version
   - Play in the built-in player or download the MP3

## API Endpoints

### Flashcards & Learning

- `PUT /flashcards/card/:id` - Update individual card learning state
- `PUT /flashcards/cards/batch` - Batch update multiple cards
- `POST /flashcards/session` - Save session progress with streak data
- `GET /flashcards/stats/:deckId?` - Retrieve learning statistics
- `GET /flashcards/streak` - Get user streak data and history
- `POST /flashcards/streak` - Update streak information

### Podcast Generation

- `POST /api/podcasts/generate` - Generate podcast from text or fileId
- `GET /api/podcasts/download/[episodeId]` - Download or stream generated MP3
- `GET /api/podcasts/metadata/[episodeId]` - Get podcast metadata and chapters
- `GET /api/podcasts/generate` - List all generated podcast episodes

## Testing

- Manual tests available in `learning.test.ts`
- Browser console: Run `runLearningTests()` for algorithm validation
- Jest setup prepared but not fully configured due to npm conflicts

## Next Steps

1. **Jest Configuration**: Complete test framework setup
2. **Backend Integration**: Implement API endpoints for full persistence
3. **Analytics Dashboard**: Add detailed learning progress visualizations
4. **Mobile Optimization**: Responsive design improvements

## Learning Algorithm Benefits

- **Optimized retention**: Evidence-based intervals maximize memory retention
- **Efficient study time**: Focus on cards that need review
- **Progressive difficulty**: Gradual advancement through mastery levels
- **Streak motivation**: Daily practice streaks maintain consistent engagement
- **Visual progress**: Calendar history and statistics provide clear feedback
- **Adaptive learning**: System responds to individual performance patterns
- **Gamification elements**: XP, levels, and streaks increase motivation and engagement

# StudySync Notes Upload System

This is a comprehensive note upload system that integrates React/Next.js frontend with Node.js/Express backend, using Prisma ORM for database operations and Supabase for file storage.

## Features

### Frontend Features

- **Drag & Drop File Upload**: Intuitive file upload with drag-and-drop functionality
- **File Validation**: Supports PDF, DOCX, and TXT files with size validation (max 50MB)
- **Upload Progress**: Real-time upload progress indicator
- **Dynamic Course Selection**: Fetches courses from database
- **Visibility Controls**: Public, Course-only, and Private visibility options
- **Responsive Design**: Works seamlessly across devices
- **Error Handling**: Comprehensive error messaging and alerts

### Backend Features

- **Secure File Upload**: Using multer with file type and size validation
- **Supabase Storage Integration**: Files stored in Supabase Storage bucket
- **Database Integration**: Full CRUD operations with Prisma ORM
- **Authentication**: JWT-based authentication with HTTP-only cookies
- **Permission System**: Access control based on note visibility
- **File Download**: Secure file download with access control
- **Like System**: Like/unlike functionality for notes

## Tech Stack

### Frontend

- **Next.js 14** with TypeScript
- **React 18** with hooks
- **Tailwind CSS** for styling
- **Shadcn/UI** for components
- **Axios** for API calls

### Backend

- **Node.js** with Express
- **Prisma ORM** for database operations
- **PostgreSQL** database
- **Supabase** for file storage
- **JWT** for authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Supabase account and project
- Git

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd studysync-website

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Environment Configuration

#### Server Environment (.env)

Copy the example file and configure:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/studysync"
DIRECT_URL="postgresql://username:password@localhost:5432/studysync"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# Supabase Configuration
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key-here"

# Server Configuration
PORT=5000
CLIENT_URL="http://localhost:3000"
SERVER_URL="http://localhost:5000"
NODE_ENV="development"
```

#### Client Environment (.env.local)

```bash
cd ../client
touch .env.local
```

Add to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Database Setup

#### Initialize Prisma and Database

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database with sample courses
npm run seed
```

### 4. Supabase Storage Setup

1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket named `study-sync-documents`
4. Create a folder named `Notes` inside the bucket
5. Set appropriate bucket policies for file access

Example bucket policy for authenticated users:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'study-sync-documents');

-- Allow public read access for notes
CREATE POLICY "Public can view notes"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'study-sync-documents');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'study-sync-documents' AND auth.uid()::text = (metadata->>'user_id'));
```

### 5. Run the Application

#### Start the Backend Server

```bash
cd server
npm run dev
```

The server will start on http://localhost:5000

#### Start the Frontend Application

```bash
cd client
npm run dev
```

The client will start on http://localhost:3000

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/validate-session` - Validate session

### Notes Endpoints

- `GET /api/notes` - Get all public notes (with filters)
- `POST /api/notes/upload` - Upload a new note (authenticated)
- `GET /api/notes/:id` - Get note by ID
- `PUT /api/notes/:id` - Update note (authenticated, owner only)
- `DELETE /api/notes/:id` - Delete note (authenticated, owner only)
- `GET /api/notes/:id/download` - Download note file
- `POST /api/notes/:id/like` - Like/unlike a note (authenticated)
- `GET /api/notes/user/:userId` - Get notes by user
- `GET /api/courses` - Get all courses

### Upload Request Format

```javascript
// FormData fields for file upload
const formData = new FormData();
formData.append("file", selectedFile); // File object
formData.append("title", "Note Title"); // String
formData.append("course", "CSE220"); // Course code
formData.append("description", "Description"); // Optional string
formData.append("visibility", "public"); // "public" | "private" | "course_only"
```

## File Structure

```
studysync-website/
├── client/                          # Next.js Frontend
│   ├── app/
│   │   ├── notes/
│   │   │   └── page.tsx             # Main notes page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── upload-notes.tsx         # Upload component
│   │   ├── header.tsx
│   │   └── ui/                      # Shadcn UI components
│   ├── lib/
│   │   ├── api.js                   # API functions
│   │   └── utils.ts
│   └── package.json
├── server/                          # Node.js Backend
│   ├── controller/
│   │   ├── authController.js
│   │   └── notesController.js       # Notes operations
│   ├── services/
│   │   ├── authService.js
│   │   └── notesService.js          # Notes business logic
│   ├── routes/
│   │   ├── auth.js
│   │   └── notes.js                 # Notes routes
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── jwtCookieMiddleware.js
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   └── seed.js                  # Database seeding
│   ├── server.js                    # Main server file
│   ├── package.json
│   └── .env.example
└── README.md
```

## Usage

### Uploading Notes

1. Navigate to the Notes page
2. Click on "Upload Your Notes" tab
3. Drag and drop a file or click to browse
4. Fill in the required fields:
   - Title (required)
   - Course selection (required)
   - Description (optional)
   - Visibility setting
5. Click "Upload Notes"

### Browsing Notes

1. Navigate to the "Browse Notes" tab
2. Use search functionality to find specific notes
3. Filter by course using the dropdown
4. Switch between grid and list view
5. Click "Download" to download files

### Features

- **File Validation**: Only PDF, DOCX, and TXT files are accepted
- **Size Limit**: Maximum file size is 50MB
- **Progress Tracking**: Real-time upload progress
- **Dynamic Courses**: Course list is fetched from the database
- **Access Control**: Visibility settings control who can access notes

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Verify DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Check database credentials

2. **Supabase Upload Error**

   - Verify SUPABASE_URL and SUPABASE_ANON_KEY
   - Check bucket name and folder structure
   - Verify bucket policies

3. **File Upload Fails**

   - Check file size (max 50MB)
   - Verify file type (PDF, DOCX, TXT only)
   - Ensure user is authenticated

4. **CORS Issues**
   - Verify CLIENT_URL in server .env
   - Check server CORS configuration

### Development Tips

1. **Database Reset**

   ```bash
   cd server
   npx prisma db push --force-reset
   npm run seed
   ```

2. **View Database**

   ```bash
   npx prisma studio
   ```

3. **Check Logs**
   - Server logs show in terminal
   - Browser console for client errors
   - Network tab for API requests

## Security Considerations

- Files are stored securely in Supabase Storage
- JWT tokens use HTTP-only cookies
- File access is controlled by visibility settings
- Input validation on both client and server
- SQL injection prevention through Prisma ORM
- File type and size validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
