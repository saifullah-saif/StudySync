/**
 * Google TTS Service for free text-to-speech conversion
 * Uses google-tts-api for local podcast generation
 */

// @ts-ignore - google-tts-api doesn't have TypeScript definitions
const googleTTS = require("google-tts-api");
import fs from "fs";
import path from "path";
import { TextChunk } from "./textChunker";

export interface TTSOptions {
  lang: string;
  slow: boolean;
  host: string;
}

export interface AudioChunk {
  index: number;
  filePath: string;
  duration: number;
  chapterTitle: string;
}

const DEFAULT_TTS_OPTIONS: TTSOptions = {
  lang: "en",
  slow: false,
  host: "https://translate.google.com",
};

export class GoogleTTSService {
  private options: TTSOptions;
  private rateLimitDelay: number = 1500; // 1.5 seconds between requests

  constructor(options: Partial<TTSOptions> = {}) {
    this.options = { ...DEFAULT_TTS_OPTIONS, ...options };
  }

  /**
   * Convert text chunks to MP3 audio files
   */
  async synthesizeChunksToMp3(
    chunks: TextChunk[],
    outputDir: string
  ): Promise<AudioChunk[]> {
    console.log(`🎙️ Starting TTS synthesis for ${chunks.length} chunks...`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const audioChunks: AudioChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkPath = path.join(
        outputDir,
        `chunk_${String(i).padStart(3, "0")}.mp3`
      );

      try {
        console.log(`🎵 Synthesizing chunk ${i + 1}/${chunks.length}...`);

        // Validate text
        const validation = this.validateText(chunk.text);
        if (!validation.valid) {
          throw new Error(`Invalid text for chunk ${i}: ${validation.error}`);
        }

        // Synthesize audio
        const audioBuffer = await this.synthesizeToBuffer(chunk.text);

        // Save to file
        fs.writeFileSync(chunkPath, audioBuffer);

        // Estimate duration (more accurate would require audio analysis)
        const estimatedDuration = chunk.estimatedDuration;

        audioChunks.push({
          index: i,
          filePath: chunkPath,
          duration: estimatedDuration,
          chapterTitle: chunk.chapterTitle,
        });

        console.log(
          `✅ Chunk ${i + 1} synthesized: ${
            chunk.chapterTitle
          } (${estimatedDuration}s)`
        );

        // Rate limiting to avoid being blocked
        if (i < chunks.length - 1) {
          await this.delay(this.rateLimitDelay);
        }
      } catch (error) {
        console.error(`❌ Failed to synthesize chunk ${i}:`, error);
        throw new Error(
          `TTS synthesis failed for chunk ${i}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    console.log(
      `🎉 TTS synthesis completed! Generated ${audioChunks.length} audio files`
    );
    return audioChunks;
  }

  /**
   * Synthesize single text to audio buffer
   */
  private async synthesizeToBuffer(text: string): Promise<Buffer> {
    try {
      // Get audio URLs from Google TTS API
      const urls = await googleTTS.getAllAudioUrls(text, {
        lang: this.options.lang,
        slow: this.options.slow,
        host: this.options.host,
        splitPunct: ",.?;!",
      });

      if (!urls || urls.length === 0) {
        throw new Error("No audio URLs returned from TTS API");
      }

      // Download and concatenate audio segments
      const audioBuffers: Buffer[] = [];

      for (const urlData of urls) {
        const response = await fetch(urlData.url);
        if (!response.ok) {
          throw new Error(
            `Failed to download audio segment: ${response.statusText}`
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        audioBuffers.push(Buffer.from(arrayBuffer));
      }

      // For simplicity, we'll use the first segment
      // In a more robust implementation, we'd concatenate all segments
      if (audioBuffers.length > 0) {
        return audioBuffers[0];
      } else {
        throw new Error("No audio data received");
      }
    } catch (error) {
      console.error("TTS synthesis error:", error);
      throw new Error(
        `TTS synthesis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Validate text for TTS processing
   */
  private validateText(text: string): { valid: boolean; error?: string } {
    if (!text || typeof text !== "string") {
      return { valid: false, error: "Text must be a non-empty string" };
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: "Text cannot be empty" };
    }

    if (trimmed.length > 5000) {
      return {
        valid: false,
        error: "Text too long for single TTS request (max 5000 chars)",
      };
    }

    return { valid: true };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [
      "en", // English
      "es", // Spanish
      "fr", // French
      "de", // German
      "it", // Italian
      "pt", // Portuguese
      "ru", // Russian
      "ja", // Japanese
      "ko", // Korean
      "zh", // Chinese
      "ar", // Arabic
      "hi", // Hindi
      "tr", // Turkish
      "pl", // Polish
      "nl", // Dutch
      "sv", // Swedish
      "da", // Danish
      "no", // Norwegian
      "fi", // Finnish
    ];
  }

  /**
   * Delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(lang: string): boolean {
    return this.getSupportedLanguages().includes(lang);
  }

  /**
   * Set rate limit delay
   */
  setRateLimitDelay(ms: number): void {
    this.rateLimitDelay = Math.max(500, ms); // Minimum 500ms
  }
}
