# Flashcard Generation from Uploaded Files

## Overview

This feature allows users to automatically generate flashcards from uploaded documents (PDF, DOCX, TXT) using OpenAI's GPT models. The system extracts text from files, processes it intelligently, and creates high-quality flashcards with customizable difficulty levels and types.

## Features

### ✅ **Complete Implementation**

- **File Processing**: Robust text extraction from PDF, DOCX, and TXT files
- **AI Generation**: OpenAI GPT-4o-mini integration with structured JSON prompts
- **Multiple Card Types**: Basic Q&A and Multiple Choice flashcards
- **Difficulty Levels**: 5 difficulty levels (Very Easy to Very Hard)
- **Job Management**: Asynchronous processing with status tracking
- **Error Handling**: Comprehensive retry logic and error recovery
- **Database Integration**: Atomic transactions for data consistency
- **Frontend UI**: Intuitive generation interface with progress tracking

## Architecture

### Backend Components

1. **FlashcardGenerationService** (`server/services/flashcardGenerationService.js`)
   - Main service handling the entire generation pipeline
   - Text extraction, chunking, AI processing, and database operations

2. **GenerationController** (`server/controller/generationController.js`)
   - API endpoints for flashcard generation operations
   - Job management and status tracking

3. **Generation Routes** (`server/routes/generation.js`)
   - RESTful API endpoints with authentication

4. **Text Extraction** (`server/lib/extractText.js`)
   - Enhanced text extraction with robust error handling

5. **Generation Templates** (`server/scripts/setupGenerationTemplates.js`)
   - Pre-configured prompt templates for different card types and difficulties

### Frontend Components

1. **File Management UI** (`client/app/assistant/files/page.tsx`)
   - "Generate Flashcards" button on each file
   - Generation configuration dialog
   - Job status tracking

2. **API Integration** (`client/lib/api.js`)
   - Client-side API functions for generation operations

## API Endpoints

### Generation Endpoints

```
POST /api/generation/files/:documentId/flashcards
GET  /api/generation/jobs/:jobId
GET  /api/generation/jobs
DELETE /api/generation/jobs/:jobId
GET  /api/generation/templates
```

### Request/Response Examples

#### Start Generation
```javascript
POST /api/generation/files/123/flashcards
{
  "deckTitle": "Biology Chapter 1",
  "cardType": "basic",
  "targetDifficulty": 3,
  "maxCards": 20,
  "templateId": null
}

Response:
{
  "success": true,
  "data": {
    "jobId": 456,
    "status": "queued",
    "message": "Flashcard generation started"
  }
}
```

#### Check Job Status
```javascript
GET /api/generation/jobs/456

Response:
{
  "success": true,
  "data": {
    "id": 456,
    "status": "completed",
    "cardsGenerated": 18,
    "startedAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:32:15Z",
    "documentTitle": "Biology Chapter 1.pdf"
  }
}
```

## Generation Process

### 1. **Job Creation**
- Creates `generation_jobs` record with status "queued"
- Validates user permissions and document access

### 2. **File Processing**
- Downloads file from Supabase Storage using service role key
- Extracts clean text using appropriate parsers (PDF.js, Mammoth, etc.)
- Validates extracted content quality

### 3. **Text Chunking**
- Intelligently splits text into manageable chunks
- Preserves sentence boundaries and context
- Optimizes for AI processing limits

### 4. **AI Generation**
- Uses structured JSON prompts for consistent output
- Implements retry logic with exponential backoff
- Validates AI responses for quality and format

### 5. **Database Storage**
- Creates flashcard deck and individual cards in atomic transaction
- Handles multiple choice options for MC cards
- Updates job status and document processing flags

### 6. **Error Handling**
- Comprehensive error recovery at each step
- Detailed error logging and user feedback
- Graceful degradation for partial failures

## Configuration Options

### Card Types
- **Basic**: Traditional question-answer format
- **Multiple Choice**: 4-option MC questions with explanations

### Difficulty Levels
1. **Very Easy**: Basic facts and definitions
2. **Easy**: Simple concepts and recall
3. **Medium**: Understanding and application
4. **Hard**: Analysis and synthesis
5. **Very Hard**: Critical thinking and complex reasoning

### Generation Parameters
- **Deck Title**: Custom name for the flashcard set
- **Max Cards**: 1-100 cards per generation
- **Template**: Optional custom prompt template

## Setup Instructions

### 1. Environment Variables
```bash
# Required for AI generation
OPENAI_API_KEY=your_openai_api_key_here

# Required for file downloads
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key_here
SUPABASE_BUCKET_NAME=study-sync-documents
```

### 2. Database Setup
```bash
# Run the template setup script
node server/scripts/setupGenerationTemplates.js
```

### 3. Dependencies
```bash
# Backend
cd server
npm install openai

# Frontend (already included)
# No additional dependencies required
```

## Usage Guide

### For Users

1. **Upload a Document**
   - Go to "My Files" tab in the assistant
   - Upload PDF, DOCX, or TXT file

2. **Generate Flashcards**
   - Click "Generate Flashcards" button on any file
   - Configure generation options:
     - Deck title
     - Card type (Basic or Multiple Choice)
     - Difficulty level (1-5)
     - Maximum number of cards

3. **Monitor Progress**
   - Job starts immediately with status tracking
   - Receive notification when complete
   - Access generated flashcards in your deck library

### For Developers

1. **Testing the System**
```bash
# Run the test suite
node server/tests/flashcardGeneration.test.js
```

2. **Adding Custom Templates**
```javascript
// Add to setupGenerationTemplates.js
const customTemplate = {
  name: "Custom Template",
  card_type: "basic",
  target_difficulty: 3,
  prompt_template: "Your custom prompt here..."
};
```

3. **Monitoring Jobs**
```javascript
// Get all user jobs
const jobs = await generationAPI.getUserJobs(1, 10, "processing");

// Check specific job
const status = await generationAPI.getJobStatus(jobId);
```

## Error Handling

### Common Issues and Solutions

1. **OpenAI API Errors**
   - Rate limiting: Automatic retry with backoff
   - Token limits: Text chunking and size validation
   - Authentication: Clear error messages

2. **File Processing Errors**
   - Unsupported formats: Clear format validation
   - Corrupted files: Graceful error handling
   - Empty content: Content validation before processing

3. **Database Errors**
   - Transaction failures: Automatic rollback
   - Constraint violations: Input validation
   - Connection issues: Retry logic

## Performance Considerations

- **Asynchronous Processing**: Jobs run in background
- **Text Chunking**: Optimized for AI token limits
- **Retry Logic**: Exponential backoff for API calls
- **Database Transactions**: Atomic operations for consistency
- **Memory Management**: Efficient file processing

## Security Features

- **Authentication**: All endpoints require valid user tokens
- **Authorization**: Users can only access their own files and jobs
- **Input Validation**: Comprehensive sanitization and validation
- **Error Sanitization**: No sensitive data in error messages
- **File Access**: Secure Supabase storage integration

## Monitoring and Logging

- **Job Status Tracking**: Real-time status updates
- **Error Logging**: Detailed error information for debugging
- **Performance Metrics**: Processing time and success rates
- **User Activity**: Generation history and statistics

## Future Enhancements

- **Batch Processing**: Multiple files at once
- **Custom Prompts**: User-defined generation templates
- **Image Processing**: OCR for image-based documents
- **Advanced Chunking**: Semantic text segmentation
- **Quality Scoring**: AI-generated quality metrics

---

## 🎉 Ready to Use!

The flashcard generation system is fully implemented and ready for production use. Users can now generate high-quality flashcards from their uploaded documents with just a few clicks!

For support or questions, refer to the test files and API documentation.
