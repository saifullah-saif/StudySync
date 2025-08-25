const { PrismaClient } = require("@prisma/client");
const huggingfaceService = require("./huggingfaceService");
const supabase = require("../lib/supabaseClient");
const { extractTextFromFile } = require("../lib/extractText");

const prisma = new PrismaClient();

console.log("✅ Flashcard Generation Service initialized with Hugging Face");

class FlashcardGenerationService {
  static instance = null;

  static getInstance() {
    if (!FlashcardGenerationService.instance) {
      FlashcardGenerationService.instance = new FlashcardGenerationService();
    }
    return FlashcardGenerationService.instance;
  }

  /**
   * Enqueue flashcard generation job for an uploaded file
   */
  async enqueueGenerationJob(documentId, userId, options = {}) {
    const {
      deckTitle,
      cardType = "basic",
      targetDifficulty = 3,
      maxCards = 20,
      templateId = null,
    } = options;

    try {
      // Validate inputs
      if (!documentId || !userId) {
        throw new Error("Document ID and User ID are required");
      }

      // Get document details
      const document = await prisma.notes.findFirst({
        where: {
          id: documentId,
          user_id: userId,
        },
      });

      if (!document) {
        throw new Error("Document not found or access denied");
      }

      // Create generation job
      const job = await prisma.generation_jobs.create({
        data: {
          document_id: documentId,
          user_id: userId,
          template_id: templateId,
          status: "queued",
          started_at: new Date(),
        },
      });

      // Process the job asynchronously (don't await)
      setImmediate(() => {
        this.processGenerationJob(job.id, document, deckTitle, {
          cardType,
          targetDifficulty,
          maxCards,
          templateId,
        }).catch((error) => {
          console.error(`Job ${job.id} failed:`, error);
          this.markJobFailed(job.id, error.message);
        });
      });

      return {
        jobId: job.id,
        status: "queued",
        message: "Flashcard generation job has been queued",
        estimatedTime: "2-5 minutes",
      };
    } catch (error) {
      console.error("Enqueue generation job error:", error);
      throw error;
    }
  }

  /**
   * Start flashcard generation job for an uploaded file
   * @deprecated Use enqueueGenerationJob for async processing
   */
  async generateFlashcardsFromFile(documentId, userId, options = {}) {
    const {
      deckTitle,
      cardType = "basic",
      targetDifficulty = 3,
      maxCards = 20,
      templateId = null,
    } = options;

    try {
      // Validate inputs
      if (!documentId || !userId) {
        throw new Error("Document ID and User ID are required");
      }

      // Get document details
      const document = await prisma.notes.findFirst({
        where: {
          id: documentId,
          user_id: userId,
        },
      });

      if (!document) {
        throw new Error("Document not found or access denied");
      }

      // Create generation job
      const job = await prisma.generation_jobs.create({
        data: {
          document_id: documentId,
          user_id: userId,
          template_id: templateId,
          status: "queued",
          started_at: new Date(),
        },
      });

      // Process the job asynchronously
      this.processGenerationJob(job.id, document, deckTitle, {
        cardType,
        targetDifficulty,
        maxCards,
        templateId,
      }).catch((error) => {
        console.error(`Job ${job.id} failed:`, error);
        this.markJobFailed(job.id, error.message);
      });

      return {
        jobId: job.id,
        status: "queued",
        message: "Flashcard generation started",
      };
    } catch (error) {
      console.error("Generate flashcards error:", error);
      throw error;
    }
  }

  /**
   * Process generation job
   */
  async processGenerationJob(jobId, document, deckTitle, options) {
    try {
      // Update job status to processing
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: { status: "processing" },
      });

      // Step 1: Download and extract text from file
      const extractedText = await this.extractTextFromDocument(document);

      if (!extractedText || extractedText.trim().length < 100) {
        throw new Error("Insufficient text content for flashcard generation");
      }

      // Step 2: Chunk the text if needed
      const chunks = this.chunkText(extractedText, options.maxCards);

      // Step 3: Generate flashcards using OpenAI
      const flashcards = await this.generateFlashcardsWithAI(
        chunks,
        options,
        jobId
      );

      if (!flashcards || flashcards.length === 0) {
        throw new Error("No flashcards were generated");
      }

      // Step 4: Save flashcards to database in a transaction
      const result = await this.saveFlashcardsToDatabase(
        document.user_id,
        document.id,
        deckTitle || document.title,
        flashcards,
        jobId
      );

      // Step 5: Mark document as processed
      await prisma.notes.update({
        where: { id: document.id },
        data: { is_processed_by_ai: true },
      });

      // Step 6: Update job status to completed
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          status: "completed",
          cards_generated: result.cardsCreated,
          completed_at: new Date(),
        },
      });

      return result;
    } catch (error) {
      console.error(`Job ${jobId} processing error:`, error);
      await this.markJobFailed(jobId, error.message);
      throw error;
    }
  }

  /**
   * Extract text from document file
   */
  async extractTextFromDocument(document) {
    try {
      if (document.file_path.startsWith("pasted_")) {
        // For pasted content, get text from document_chunks
        const chunks = await prisma.document_chunks.findMany({
          where: { document_id: document.id },
          orderBy: { chunk_order: "asc" },
        });
        return chunks.map((chunk) => chunk.chunk_text).join("\n\n");
      }

      // For uploaded files, download from Supabase and extract text
      const bucketName =
        process.env.SUPABASE_BUCKET_NAME || "study-sync-documents";

      // Download file from Supabase using service role key
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(document.file_path);

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      // Convert blob to buffer
      const buffer = Buffer.from(await fileData.arrayBuffer());

      // Extract text based on file type
      const extractedText = await extractTextFromFile(
        buffer,
        document.file_type
      );

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("No text could be extracted from the file");
      }

      return extractedText;
    } catch (error) {
      console.error("Text extraction error:", error);
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  /**
   * Chunk text into manageable pieces for AI processing
   */
  chunkText(text, maxCards = 20) {
    const maxChunkSize = 3000; // Characters per chunk
    const minChunkSize = 500;

    // If text is small enough, return as single chunk
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    let currentChunk = "";

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      // If adding this sentence would exceed max size, save current chunk
      if (
        currentChunk.length + trimmedSentence.length > maxChunkSize &&
        currentChunk.length > minChunkSize
      ) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim().length > minChunkSize) {
      chunks.push(currentChunk.trim());
    }

    // Limit number of chunks based on maxCards
    const maxChunks = Math.ceil(maxCards / 3); // Assume ~3 cards per chunk
    return chunks.slice(0, maxChunks);
  }

  /**
   * Generate flashcards using OpenAI or fallback
   */
  async generateFlashcardsWithAI(chunks, options, jobId) {
    if (!hasOpenAI) {
      console.log("Using fallback flashcard generation (OpenAI not available)");
      return this.generateFallbackFlashcards(chunks, options);
    }

    const { cardType, targetDifficulty, maxCards } = options;
    const allFlashcards = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Get or create prompt template
        const prompt = await this.getPromptTemplate(cardType, targetDifficulty);

        // Calculate cards for this chunk
        const cardsPerChunk = Math.ceil(maxCards / chunks.length);

        const response = await this.callOpenAIWithRetry(
          prompt,
          chunk,
          cardsPerChunk
        );

        if (
          response &&
          response.flashcards &&
          Array.isArray(response.flashcards)
        ) {
          allFlashcards.push(...response.flashcards);
        }

        // Update job progress
        const progress = Math.round(((i + 1) / chunks.length) * 80); // 80% for AI generation
        await this.updateJobProgress(jobId, progress);
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        // Continue with other chunks even if one fails
      }
    }

    // Limit to maxCards and validate
    const validFlashcards = this.validateAndLimitFlashcards(
      allFlashcards,
      maxCards
    );

    return validFlashcards;
  }

  /**
   * Generate fallback flashcards when OpenAI is not available
   */
  async generateFallbackFlashcards(chunks, options) {
    const { cardType, targetDifficulty, maxCards } = options;
    
    // Create basic flashcards from text analysis
    const fallbackCards = [];
    const text = chunks.join("\n\n");
    
    // Simple text-based flashcard generation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const words = text.toLowerCase().split(/\s+/);
    
    // Find key terms (words that appear multiple times)
    const wordCount = {};
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 3) {
        wordCount[cleaned] = (wordCount[cleaned] || 0) + 1;
      }
    });
    
    const keyTerms = Object.entries(wordCount)
      .filter(([word, count]) => count >= 2 && count <= 10)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxCards)
      .map(([word]) => word);

    // Generate basic definition cards
    for (let i = 0; i < Math.min(keyTerms.length, maxCards); i++) {
      const term = keyTerms[i];
      
      // Find sentences containing the term
      const relevantSentences = sentences.filter(sentence => 
        sentence.toLowerCase().includes(term)
      ).slice(0, 2);
      
      if (relevantSentences.length > 0) {
        const question = `What is ${term.charAt(0).toUpperCase() + term.slice(1)}?`;
        const answer = relevantSentences.join('. ').trim();
        
        fallbackCards.push({
          question,
          answer,
          explanation: `This information was extracted from the document.`,
          difficulty_level: targetDifficulty,
          source_text: answer
        });
      }
    }
    
    // If we don't have enough cards, add some general questions
    if (fallbackCards.length < 3) {
      const generalCards = [
        {
          question: "What is the main topic of this document?",
          answer: "This document discusses the key concepts and processes described in the uploaded material.",
          explanation: "Generated based on document content analysis.",
          difficulty_level: targetDifficulty,
          source_text: text.substring(0, 200) + "..."
        },
        {
          question: "What are the key processes mentioned in this document?",
          answer: "The document covers various important processes and concepts that are central to the subject matter.",
          explanation: "Extracted from document analysis.",
          difficulty_level: targetDifficulty,
          source_text: text.substring(0, 200) + "..."
        }
      ];
      
      fallbackCards.push(...generalCards.slice(0, Math.max(3 - fallbackCards.length, 0)));
    }
    
    return fallbackCards.slice(0, maxCards);
  }

  /**
   * Get prompt template for flashcard generation
   */
  async getPromptTemplate(cardType, targetDifficulty) {
    // Try to get from database first
    const template = await prisma.generation_templates.findFirst({
      where: {
        card_type: cardType,
        target_difficulty: targetDifficulty,
        is_default: true,
      },
    });

    if (template) {
      return template.prompt_template;
    }

    // Fallback to hardcoded templates
    return this.getDefaultPromptTemplate(cardType, targetDifficulty);
  }

  /**
   * Get default prompt template
   */
  getDefaultPromptTemplate(cardType, targetDifficulty) {
    const difficultyMap = {
      1: "very easy",
      2: "easy",
      3: "medium",
      4: "hard",
      5: "very hard",
    };

    const difficultyLevel = difficultyMap[targetDifficulty] || "medium";

    if (cardType === "multiple_choice") {
      return `You are an expert educator creating ${difficultyLevel} difficulty multiple choice flashcards from educational content.

INSTRUCTIONS:
- Create exactly the requested number of multiple choice flashcards
- Each flashcard should test important concepts from the text
- Questions should be ${difficultyLevel} difficulty level
- Provide 4 options (A, B, C, D) with exactly one correct answer
- Include brief explanations for the correct answers
- Focus on key concepts, definitions, processes, and relationships
- Avoid trivial details or overly specific information

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "question": "Clear, specific question text",
      "options": [
        {"text": "Option A text", "is_correct": false},
        {"text": "Option B text", "is_correct": true},
        {"text": "Option C text", "is_correct": false},
        {"text": "Option D text", "is_correct": false}
      ],
      "explanation": "Brief explanation of why the correct answer is right",
      "difficulty_level": ${targetDifficulty},
      "source_text": "Relevant excerpt from source text"
    }
  ]
}

TEXT TO PROCESS:
{text}

Generate exactly {cardCount} multiple choice flashcards. Return only valid JSON.`;
    }

    // Default basic flashcard template
    return `You are an expert educator creating ${difficultyLevel} difficulty flashcards from educational content.

INSTRUCTIONS:
- Create exactly the requested number of flashcards
- Each flashcard should test important concepts from the text
- Questions should be ${difficultyLevel} difficulty level
- Answers should be concise but complete
- Include brief explanations when helpful
- Focus on key concepts, definitions, processes, and relationships
- Avoid trivial details or overly specific information

REQUIRED JSON FORMAT:
{
  "flashcards": [
    {
      "question": "Clear, specific question text",
      "answer": "Concise, accurate answer",
      "explanation": "Brief explanation or additional context (optional)",
      "difficulty_level": ${targetDifficulty},
      "source_text": "Relevant excerpt from source text"
    }
  ]
}

TEXT TO PROCESS:
{text}

Generate exactly {cardCount} flashcards. Return only valid JSON.`;
  }

  /**
   * Call OpenAI API with retry logic and comprehensive error handling
   */
  async callOpenAIWithRetry(promptTemplate, text, cardCount, maxRetries = 3) {
    if (!hasOpenAI || !openai) {
      throw new Error("OpenAI not available - API key not configured");
    }

    const prompt = promptTemplate
      .replace("{text}", text)
      .replace("{cardCount}", cardCount.toString());

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Validate inputs before making API call
        if (!prompt || prompt.trim().length === 0) {
          throw new Error("Empty prompt provided to OpenAI");
        }

        if (text.length > 15000) {
          console.warn(
            `Text length (${text.length}) is quite large, may hit token limits`
          );
        }

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an expert educator. Always respond with valid JSON only. Do not include any text outside the JSON structure.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" },
        });

        // Validate response structure
        if (!response || !response.choices || response.choices.length === 0) {
          throw new Error("Invalid response structure from OpenAI");
        }

        const content = response.choices[0]?.message?.content;
        if (!content || content.trim().length === 0) {
          throw new Error("Empty response content from OpenAI");
        }

        // Parse and validate JSON
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch (parseError) {
          throw new Error(
            `Invalid JSON response from OpenAI: ${parseError.message}`
          );
        }

        // Validate parsed structure
        if (!parsed || typeof parsed !== "object") {
          throw new Error("OpenAI response is not a valid object");
        }

        if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
          throw new Error("OpenAI response missing flashcards array");
        }

        if (parsed.flashcards.length === 0) {
          throw new Error("OpenAI generated no flashcards");
        }

        // Validate each flashcard
        const validFlashcards = parsed.flashcards.filter((card) => {
          return (
            card &&
            typeof card === "object" &&
            card.question &&
            typeof card.question === "string" &&
            card.question.trim().length > 0 &&
            card.answer &&
            typeof card.answer === "string" &&
            card.answer.trim().length > 0
          );
        });

        if (validFlashcards.length === 0) {
          throw new Error("No valid flashcards found in OpenAI response");
        }

        console.log(
          `OpenAI attempt ${attempt} succeeded: Generated ${validFlashcards.length} valid flashcards`
        );

        return {
          ...parsed,
          flashcards: validFlashcards,
        };
      } catch (error) {
        lastError = error;
        console.error(`OpenAI attempt ${attempt} failed:`, error.message);

        // Check if it's a rate limit error
        if (error.status === 429 || error.message.includes("rate limit")) {
          console.log(`Rate limit hit, waiting longer before retry...`);
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 2000)
          );
          continue;
        }

        // Check if it's a token limit error
        if (error.status === 400 && error.message.includes("token")) {
          throw new Error(
            `Text is too long for OpenAI processing: ${error.message}`
          );
        }

        // Check if it's an authentication error
        if (error.status === 401) {
          throw new Error("OpenAI API authentication failed. Check API key.");
        }

        // Check if it's a server error
        if (error.status >= 500) {
          console.log(`OpenAI server error, retrying...`);
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
          continue;
        }

        // For other errors, don't retry if it's the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    // If we get here, all attempts failed
    throw new Error(
      `OpenAI API failed after ${maxRetries} attempts. Last error: ${
        lastError?.message || "Unknown error"
      }`
    );
  }

  /**
   * Validate and limit flashcards
   */
  validateAndLimitFlashcards(flashcards, maxCards) {
    const validFlashcards = flashcards.filter((card) => {
      return (
        card.question &&
        card.question.trim().length > 0 &&
        card.answer &&
        card.answer.trim().length > 0 &&
        card.question.trim().length <= 500 &&
        card.answer.trim().length <= 1000
      );
    });

    return validFlashcards.slice(0, maxCards);
  }

  /**
   * Save flashcards to database in a transaction
   */
  async saveFlashcardsToDatabase(
    userId,
    documentId,
    deckTitle,
    flashcards,
    jobId
  ) {
    return await prisma.$transaction(async (tx) => {
      try {
        // Create flashcard deck
        const deck = await tx.flashcard_decks.create({
          data: {
            user_id: userId,
            document_id: documentId,
            title: deckTitle,
            description: `Generated from ${deckTitle}`,
            creation_method: "ai_generated",
            is_public: false,
          },
        });

        let cardsCreated = 0;

        // Create flashcards
        for (const cardData of flashcards) {
          const flashcard = await tx.flashcards.create({
            data: {
              deck_id: deck.id,
              question: cardData.question.trim(),
              answer: cardData.answer.trim(),
              explanation: cardData.explanation?.trim() || null,
              difficulty_level: cardData.difficulty_level || 3,
              card_type: cardData.options ? "multiple_choice" : "basic",
              source_text: cardData.source_text?.trim() || null,
              auto_generated: true,
              confidence_score: 0.85, // Default confidence for AI generated cards
            },
          });

          // Create options for multiple choice cards
          if (cardData.options && Array.isArray(cardData.options)) {
            for (let i = 0; i < cardData.options.length; i++) {
              const option = cardData.options[i];
              await tx.flashcard_options.create({
                data: {
                  flashcard_id: flashcard.id,
                  option_text: option.text.trim(),
                  is_correct: option.is_correct || false,
                  option_order: i + 1,
                },
              });
            }
          }

          cardsCreated++;
        }

        return {
          deckId: deck.id,
          cardsCreated,
          deckTitle: deck.title,
        };
      } catch (error) {
        console.error("Database transaction error:", error);
        throw error;
      }
    });
  }

  /**
   * Mark job as failed
   */
  async markJobFailed(jobId, errorMessage) {
    try {
      await prisma.generation_jobs.update({
        where: { id: jobId },
        data: {
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to mark job as failed:", error);
    }
  }

  /**
   * Update job progress
   */
  async updateJobProgress(jobId, progress) {
    try {
      // This could be extended to include progress tracking
      // For now, we'll just update the status if needed
      console.log(`Job ${jobId} progress: ${progress}%`);
    } catch (error) {
      console.error("Failed to update job progress:", error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId, userId) {
    try {
      const job = await prisma.generation_jobs.findFirst({
        where: {
          id: jobId,
          user_id: userId,
        },
        include: {
          notes: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!job) {
        throw new Error("Job not found or access denied");
      }

      return {
        id: job.id,
        status: job.status,
        cardsGenerated: job.cards_generated || 0,
        errorMessage: job.error_message,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        documentTitle: job.notes?.title,
      };
    } catch (error) {
      console.error("Get job status error:", error);
      throw error;
    }
  }
}

module.exports = FlashcardGenerationService.getInstance();
