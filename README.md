# StudySync 📚
*Your Complete Academic Study Companion*

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/saifullah-saif/StudySync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-blue.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

## 🚀 About StudySync

StudySync is a comprehensive SaaS platform designed to revolutionize academic studying. It combines intelligent spaced repetition flashcards, collaborative note sharing, AI-powered study tools, library room booking, and innovative PDF-to-podcast conversion to create the ultimate learning ecosystem for students.

### ✨ Key Highlights
- 🧠 **Advanced Spaced Repetition**: Evidence-based learning algorithms
- 🤝 **Study Community**: Connect with study buddies and share resources
- 🎧 **PDF-to-Podcast**: Transform documents into audio content
- 📚 **Smart Note Management**: Upload, organize, and share study materials
- 📊 **Analytics & Gamification**: Track progress with XP, levels, and streaks
- 🏛️ **Library Integration**: Book study spaces and manage reservations

Visit [StudySync](https://study-sync-client.vercel.app/) 
---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Authentication](#-authentication--authorization)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Features

### 🧠 **Intelligent Flashcard System**
- **Spaced Repetition Algorithm**: Based on SuperMemo with modern enhancements
- **Adaptive Learning**: AI adjusts difficulty based on performance
- **Progress Tracking**: XP system, levels, and mastery stages
- **Daily Streaks**: Gamified learning with streak maintenance
- **Performance Analytics**: Success rates, review history, and statistics

### 📚 **Collaborative Note Platform**
- **File Upload & Sharing**: Support for PDF, DOCX, and TXT files (up to 50MB)
- **Visibility Controls**: Public, course-only, and private sharing options
- **Course Integration**: Organize notes by academic courses
- **Search & Filter**: Advanced search with course-based filtering
- **Like System**: Community engagement and content curation

### 🎧 **PDF-to-Podcast Conversion**
- **Text-to-Speech**: High-quality audio generation using Google TTS
- **Smart Chunking**: Sentence-aware text splitting for natural flow
- **Chapter Navigation**: Interactive audio player with bookmarks
- **Download & Stream**: Offline access to generated podcasts
- **Content Caching**: Efficient re-generation prevention

### 👥 **Study Community Features**
- **Study Buddy Matching**: Connect with compatible study partners
- **Chat System**: Real-time messaging with Socket.io
- **Group Formation**: Create and join study groups
- **Activity Tracking**: Monitor study sessions and progress

### 🏛️ **Library Management**
- **Room Booking**: Reserve study spaces in advance
- **Seat Selection**: Visual seat picker with availability
- **Reservation Management**: View, modify, and cancel bookings
- **Real-time Updates**: Live availability status

### 🤖 **AI-Powered Tools**
- **Content Summarization**: AI-generated note summaries
- **Flashcard Generation**: Automatic card creation from notes
- **Study Recommendations**: Personalized learning suggestions
- **Progress Insights**: AI-driven performance analysis

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 15.2.4 with TypeScript
- **UI Library**: React 19 with Radix UI primitives
- **Styling**: Tailwind CSS + Shadcn/UI components
- **State Management**: React Context API + Hooks
- **Real-time**: Socket.io-client
- **HTTP Client**: Axios
- **Forms**: React Hook Form with Zod validation

### **Backend**
- **Runtime**: Node.js 22 with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with HTTP-only cookies
- **File Storage**: Supabase Storage
- **Real-time**: Socket.io
- **File Processing**: Multer, PDF-lib, Mammoth
- **Audio Generation**: Google TTS API + FFmpeg

### **AI & Machine Learning**
- **LangChain**: Document processing and AI integration
- **OpenAI API**: GPT-powered content generation
- **Vector Processing**: Text embedding and similarity search

### **DevOps & Deployment**
- **Hosting**: Vercel (Frontend) + Custom server deployment
- **Database**: PostgreSQL (Production ready)
- **CDN**: Vercel Edge Network
- **Monitoring**: Built-in logging and error tracking

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/saifullah-saif/StudySync.git
cd StudySync

# Install dependencies for both client and server
npm run install-all

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env.local

# Initialize database
cd server && npm run db:setup

# Start development servers
npm run dev
```

Visit `https://study-sync-client.vercel.app/` to see StudySync in action! 🎉

---

## 📦 Installation

### Prerequisites
- **Node.js** 18+ 
- **PostgreSQL** 13+
- **Git**
- **Supabase Account** (for file storage)

### Detailed Setup

#### 1. **Clone & Install**
```bash
git clone https://github.com/saifullah-saif/StudySync.git
cd StudySync

# Client dependencies
cd client
pnpm install

# Server dependencies  
cd ../server
npm install
```

#### 2. **Database Setup**
```bash
cd server

# Generate Prisma client
npx prisma generate

# Pull schema from database
npx prisma db pull


```

#### 3. **Start Development**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend  
cd client && pnpm run dev
```

---

## ⚙️ Configuration

### **Environment Variables**

#### **Server (.env)**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/studysync"
DIRECT_URL="postgresql://user:password@localhost:5432/studysync"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-256-bit"

# Supabase Storage
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# Server Configuration
PORT=5000
CLIENT_URL="http://localhost:3000"
SERVER_URL="http://localhost:5000"
NODE_ENV="development"

# AI Services (Optional)
OPENAI_API_KEY="your-openai-api-key"
```

#### **Client (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### **Supabase Storage Setup**

1. Create bucket: `study-sync-documents`
2. Create folder: `Notes`
3. Configure access policies:

```sql
-- Allow authenticated uploads
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'study-sync-documents');

-- Public read access
CREATE POLICY "Public can view notes"  
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'study-sync-documents');
```

---

## 📖 Usage

### **For Students**

#### **Getting Started**
1. **Sign Up**: Create account with email and university details
2. **Profile Setup**: Add department, semester, and study preferences  
3. **Join Courses**: Select your academic courses for content organization

#### **Study with Flashcards**
```bash
# Navigate to Flashcards section
1. Create new deck or browse existing ones
2. Start study session with spaced repetition
3. Answer cards and track your progress  
4. Maintain daily streaks for optimal learning
```

#### **Share & Discover Notes**
- **Upload**: Drag-and-drop PDF/DOCX files with course tagging
- **Browse**: Search notes by course, keyword, or popularity
- **Collaborate**: Like, comment, and share valuable resources

#### **Generate Podcasts**
- **Convert**: Transform any PDF into audio format
- **Listen**: Use built-in player with chapter navigation
- **Download**: Save for offline listening

### **For Administrators**

#### **Content Management**
- Monitor note uploads and user activity
- Moderate community content and resolve reports
- Manage course listings and categories

#### **Analytics Dashboard**
- Track user engagement and platform usage
- Monitor system performance and error rates
- Generate reports on learning outcomes

---

## 📚 API Documentation

### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | User registration | ❌ |
| `POST` | `/api/auth/login` | User login | ❌ |
| `POST` | `/api/auth/logout` | User logout | ✅ |
| `GET` | `/api/auth/me` | Get current user | ✅ |
| `GET` | `/api/auth/validate-session` | Validate JWT token | ✅ |

### **Flashcard Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/flashcards/:deckId` | Get deck flashcards | ✅ |
| `POST` | `/api/flashcards` | Create new flashcard | ✅ |
| `PUT` | `/api/flashcards/:id` | Update flashcard | ✅ |
| `DELETE` | `/api/flashcards/:id` | Delete flashcard | ✅ |
| `POST` | `/api/flashcards/session` | Save study session | ✅ |
| `GET` | `/api/flashcards/stats/:deckId` | Get learning statistics | ✅ |

### **Notes Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/notes` | Get all public notes | ❌ |
| `POST` | `/api/notes/upload` | Upload new note | ✅ |
| `GET` | `/api/notes/:id` | Get note by ID | ❌ |
| `PUT` | `/api/notes/:id` | Update note | ✅ |
| `DELETE` | `/api/notes/:id` | Delete note | ✅ |
| `GET` | `/api/notes/:id/download` | Download note file | ❌ |
| `POST` | `/api/notes/:id/like` | Like/unlike note | ✅ |

### **Podcast Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/podcasts/generate` | Generate podcast from text | ✅ |
| `GET` | `/api/podcasts/download/:id` | Download MP3 file | ❌ |
| `GET` | `/api/podcasts/metadata/:id` | Get podcast metadata | ❌ |

### **Request Examples**

#### **Create Flashcard**
```javascript
POST /api/flashcards
Content-Type: application/json

{
  "question": "What is the capital of France?",
  "answer": "Paris",
  "deckId": "deck_123",
  "difficulty": "easy",
  "tags": ["geography", "europe"]
}
```

#### **Upload Note**
```javascript
POST /api/notes/upload
Content-Type: multipart/form-data

{
  "file": [File object],
  "title": "Calculus Notes - Chapter 1", 
  "course": "MATH101",
  "description": "Limits and continuity concepts",
  "visibility": "public"
}
```

---

## 🚀 Deployment

### **Frontend (Vercel)**

#### **Automatic Deployment**
```bash
# Connect repository to Vercel
# Automatic deployments on push to main branch
```

#### **Manual Deployment**
```bash
cd client
npm run build
npx vercel --prod
```

#### **Environment Variables**
```env
NEXT_PUBLIC_API_URL=https://your-server-domain.com/api
```

### **Backend (Custom Server)**

#### **Production Setup**
```bash
# Clone on server
git clone https://github.com/saifullah-saif/StudySync.git
cd StudySync/server

# Install dependencies
npm ci --production

# Set up environment
cp .env.example .env
# Edit .env with production values

# Database setup
npx prisma db push
npm run seed

# Start with PM2
npm install -g pm2
pm2 start server.js --name "studysync-server"
pm2 save
pm2 startup
```

#### **Docker Deployment**
```dockerfile
# Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t studysync-server .
docker run -p 5000:5000 --env-file .env studysync-server
```

### **Database (PostgreSQL)**

#### **Production Database**
- Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- Configure connection pooling
- Set up automated backups
- Enable SSL connections

---

## 🔐 Authentication & Authorization

### **JWT Implementation**

#### **Token Structure**
```javascript
{
  "id": "user_123",
  "email": "student@university.edu", 
  "name": "John Doe",
  "role": "student",
  "iat": 1643723400,
  "exp": 1643809800
}
```

#### **Security Features**
- **HTTP-only cookies**: Prevent XSS attacks
- **CORS protection**: Restrict cross-origin requests
- **Rate limiting**: Prevent brute force attacks
- **Input validation**: Sanitize all user inputs
- **SQL injection prevention**: Parameterized queries with Prisma

#### **Role-Based Access Control**

| Role | Permissions |
|------|------------|
| **Student** | Create/edit own content, access public resources |
| **Moderator** | Review content, moderate community posts |
| **Admin** | Full system access, user management |

### **Password Security**
- **Hashing**: bcryptjs with salt rounds = 10
- **Complexity requirements**: Minimum 8 characters
- **Password reset**: Secure token-based reset flow

---

## 🧪 Testing

### **Test Structure**
```
├── client/__tests__/
│   ├── StudyFlashcards.test.tsx
│   ├── components/
│   └── utils/
├── server/__tests__/
│   ├── textChunker.test.ts
│   ├── auth.test.js
│   └── api/
```

### **Running Tests**

#### **Frontend Tests**
```bash
cd client

# Run all tests
pnpm test

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:coverage
```

#### **Backend Tests**
```bash
cd server

# Run all tests  
npm test

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

### **Test Coverage Goals**
- **Unit Tests**: >80% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user workflows
- **Performance Tests**: Response time <200ms

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

### **Development Workflow**

1. **Fork the repository**
   ```bash
   git fork https://github.com/saifullah-saif/StudySync.git
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make changes**
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run test
   npm run lint
   ```

5. **Submit pull request**
   - Provide clear description
   - Reference related issues
   - Include screenshots for UI changes

### **Code Standards**

#### **TypeScript/JavaScript**
- Use TypeScript for new code
- Follow ESLint configuration
- Prefer functional components and hooks
- Use Prettier for formatting

#### **Database Changes**
- Create Prisma migrations for schema changes
- Include seed data for new tables
- Document breaking changes

#### **API Guidelines**
- RESTful endpoint design
- Consistent error response format
- Input validation with Zod
- Comprehensive JSDoc comments

### **Issue Guidelines**

- **Bug Reports**: Include reproduction steps and environment details
- **Feature Requests**: Describe use case and expected behavior  
- **Questions**: Check existing documentation first

---

## 🗺️ Roadmap

### **Version 2.0 - Q2 2025**
- [ ] **Mobile App**: React Native mobile application
- [ ] **Advanced AI**: GPT-4 integration for content generation
- [ ] **Collaborative Editing**: Real-time document collaboration
- [ ] **Video Integration**: Upload and process video lectures
- [ ] **Advanced Analytics**: Detailed learning insights dashboard

### **Version 2.1 - Q3 2025**
- [ ] **Offline Mode**: PWA with offline functionality
- [ ] **API v2**: GraphQL API with improved performance
- [ ] **Plugin System**: Third-party integrations and extensions
- [ ] **Advanced Search**: Vector-based semantic search
- [ ] **Multi-language**: Internationalization support

### **Version 3.0 - Q4 2025**
- [ ] **VR Study Rooms**: Virtual reality study environments
- [ ] **Blockchain Certificates**: NFT-based achievement system
- [ ] **AI Tutoring**: Personalized AI study assistant
- [ ] **Enterprise Features**: University-wide deployment tools

### **Community Requests**
- [ ] Dark mode theme options
- [ ] Export study data (CSV, PDF)
- [ ] Integration with LMS platforms (Canvas, Blackboard)
- [ ] Calendar synchronization
- [ ] Study group video calls

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 StudySync

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 💬 Support

### **Getting Help**

- **📖 Documentation**: Check our [detailed guides](docs/)

- **🐛 Bug Reports**: Open an [issue on GitHub](https://github.com/saifullah-saif/StudySync/issues)
- **💡 Feature Requests**: Submit via [GitHub Discussions](https://github.com/saifullah-saif/StudySync/discussions)

<!-- ### **Contact Information**

- **Email**: support@studysync.app
- **Twitter**: [@StudySyncApp](https://twitter.com/StudySyncApp)
- **LinkedIn**: [StudySync](https://linkedin.com/company/studysync) -->

### **Response Times**
- **Critical bugs**: Within 24 hours
- **General inquiries**: 2-3 business days
- **Feature requests**: Weekly review cycle

---

## 🙏 Acknowledgments

### **Contributors**
Special thanks to all contributors who have helped build StudySync:

- **Core Team**: Saifullah Saif, Md. Farhan Ishrak, Maisha Meherin, Tahira Binte Amin
- **Beta Testers**: Students from BRACU and other universities

### **Open Source Libraries**
We're grateful to the open source community for these amazing libraries:

- **Next.js & React** - Frontend framework and library
- **Prisma** - Database toolkit and ORM
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io** - Real-time communication
- **LangChain** - AI and LLM integration

### **Services & APIs**
- **Supabase** - Backend-as-a-Service and storage
- **Vercel** - Frontend hosting and deployment
- **Google TTS API** - Text-to-speech conversion
- **OpenAI** - AI-powered features

---

<div align="center">

### **Built with ❤️ for Students Everywhere**

**StudySync** - *Empowering Academic Excellence Through Technology*

[⭐ Star us on GitHub](https://github.com/saifullah-saif/StudySync) | [🚀 Try StudySync](https://study-sync-client.vercel.app/) | [📖 Read the Docs](https://docs.studysync.app)

</div>
