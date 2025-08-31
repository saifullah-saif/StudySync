import * as fs from "fs/promises";
import * as path from "path";
const googleTTS = require("google-tts-api");

export interface TTSOptions {
  lang?: string;
  slow?: boolean;
  host?: string;
}

export interface SynthesisResult {
  chunkFiles: string[];
  totalDuration: number;
  errors: string[];
}

/**
 * Google TTS service for synthesizing text chunks into MP3 files
 */
export class GoogleTTSService {
  private readonly defaultOptions: TTSOptions = {
    lang: "en",
    slow: false,
    host: "https://translate.google.com",
  };

  /**
   * Synthesizes an array of text chunks into MP3 files
   * @param chunks - Array of text chunks to synthesize
   * @param outputDir - Directory to save MP3 files
   * @param options - TTS options
   * @returns Promise with file paths and metadata
   */
  async synthesizeChunksToMp3(
    chunks: string[],
    outputDir: string,
    options: TTSOptions = {}
  ): Promise<SynthesisResult> {
    const opts = { ...this.defaultOptions, ...options };
    const chunkFiles: string[] = [];
    const errors: string[] = [];
    let totalDuration = 0;

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`🎙️ Synthesizing ${chunks.length} chunks to ${outputDir}`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const fileName = `chunk-${String(i).padStart(3, "0")}.mp3`;
      const filePath = path.join(outputDir, fileName);

      try {
        console.log(`🔊 Processing chunk ${i + 1}/${chunks.length}...`);

        // Get audio URL from Google TTS
        const audioUrl = googleTTS.getAudioUrl(chunk, {
          lang: opts.lang!,
          slow: opts.slow!,
          host: opts.host!,
        });

        // Fetch the audio data
        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch audio: ${response.status} ${response.statusText}`
          );
        }

        const audioBuffer = await response.arrayBuffer();

        // Save to file
        await fs.writeFile(filePath, Buffer.from(audioBuffer));

        chunkFiles.push(filePath);

        // Estimate duration (rough calculation: ~150 words per minute)
        const wordCount = chunk.trim().split(/\s+/).length;
        const estimatedDuration = (wordCount / 150) * 60;
        totalDuration += estimatedDuration;

        // Small delay to avoid rate limiting
        if (i < chunks.length - 1) {
          await this.delay(100);
        }
      } catch (error) {
        const errorMsg = `Failed to synthesize chunk ${i + 1}: ${
          error instanceof Error ? error.message : String(error)
        }`;
        console.error(errorMsg);
        errors.push(errorMsg);

        // Continue with other chunks
        continue;
      }
    }

    console.log(
      `✅ Synthesized ${chunkFiles.length}/${chunks.length} chunks successfully`
    );

    if (chunkFiles.length === 0) {
      throw new Error("Failed to synthesize any audio chunks");
    }

    return {
      chunkFiles,
      totalDuration,
      errors,
    };
  }

  /**
   * Synthesizes a single text chunk
   * @param text - Text to synthesize
   * @param outputPath - Output file path
   * @param options - TTS options
   */
  async synthesizeSingleChunk(
    text: string,
    outputPath: string,
    options: TTSOptions = {}
  ): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      const audioUrl = googleTTS.getAudioUrl(text, {
        lang: opts.lang!,
        slow: opts.slow!,
        host: opts.host!,
      });

      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch audio: ${response.status} ${response.statusText}`
        );
      }

      const audioBuffer = await response.arrayBuffer();

      // Ensure directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Save to file
      await fs.writeFile(outputPath, Buffer.from(audioBuffer));
    } catch (error) {
      throw new Error(
        `TTS synthesis failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Validates text for TTS synthesis
   * @param text - Text to validate
   * @returns Validation result
   */
  validateText(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: "Text cannot be empty" };
    }

    if (text.length > 200000) {
      return {
        valid: false,
        error: "Text is too long (max 200,000 characters)",
      };
    }

    // Check for supported characters (basic Latin)
    const unsupportedChars = text.match(/[^\x00-\x7F\s]/g);
    if (unsupportedChars && unsupportedChars.length > text.length * 0.1) {
      return {
        valid: false,
        error: "Text contains too many unsupported characters",
      };
    }

    return { valid: true };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Gets supported languages
   */
  static getSupportedLanguages(): string[] {
    return [
      "en",
      "es",
      "fr",
      "de",
      "it",
      "pt",
      "ru",
      "ja",
      "ko",
      "zh",
      "ar",
      "hi",
      "tr",
      "pl",
      "nl",
      "sv",
      "da",
      "no",
      "fi",
    ];
  }
}

// Export singleton instance
export const googleTTSService = new GoogleTTSService();
