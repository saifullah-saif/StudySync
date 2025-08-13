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
