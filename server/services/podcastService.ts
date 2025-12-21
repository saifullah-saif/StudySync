import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { chunkText, generateChapterTitles } from "../utils/textChunker";
import { googleTTSService } from "./tts/googleTtsService";
import { ffmpegService } from "./ffmpegService";

export interface Chapter {
  title: string;
  startSec: number;
  durationSec: number;
  chunkIndex: number;
}

export interface PodcastOptions {
  title?: string;
  lang?: string;
  maxChunkSize?: number;
  normalize?: boolean;
}

export interface PodcastMetadata {
  episodeId: string;
  title: string;
  createdAt: string;
  lang: string;
  chapters: Chapter[];
  totalDurationSec: number;
  chunkFiles: string[];
  textLength: number;
  finalMp3Path: string;
}

export interface PodcastResult {
  episodeId: string;
  outPath: string;
  metadataPath: string;
  chapters: Chapter[];
  metadata: PodcastMetadata;
}

/**
 * Main podcast generation service that orchestrates the entire pipeline
 */
export class PodcastService {
  private readonly baseDir: string;

  constructor(baseDir: string = "/tmp/studysync-podcasts") {
    this.baseDir = baseDir;
  }

  /**
   * Generates a podcast from text using the complete pipeline
   * @param text - Input text to convert to podcast
   * @param options - Generation options
   * @returns Promise with podcast result and metadata
   */
  async generatePodcastFromText(
    text: string,
    options: PodcastOptions = {}
  ): Promise<PodcastResult> {
    const {
      title = "StudySync Podcast",
      lang = "en",
      maxChunkSize = 1800,
      normalize = false,
    } = options;

    console.log("🎙️ Starting podcast generation...");

    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }

    if (text.length > 200000) {
      throw new Error("Text is too long (max 200,000 characters)");
    }

    // Generate unique episode ID based on content hash
    const contentHash = this.generateContentHash(text, title, lang);
    const episodeId = contentHash;
    const episodeDir = path.join(this.baseDir, episodeId);

    console.log(`📁 Episode ID: ${episodeId}`);
    console.log(`📂 Episode directory: ${episodeDir}`);

    // Check if already generated (cache hit)
    const cachedResult = await this.checkCache(episodeDir);
    if (cachedResult) {
      console.log("🎯 Found cached podcast, returning existing result");
      return cachedResult;
    }

    // Create episode directory
    await fs.mkdir(episodeDir, { recursive: true });

    const logPath = path.join(episodeDir, "log.txt");
    const startTime = Date.now();

    try {
      await this.log(logPath, `Starting podcast generation for: ${title}`);
      await this.log(logPath, `Text length: ${text.length} characters`);
      await this.log(logPath, `Language: ${lang}`);

      // Step 1: Chunk the text
      console.log("✂️ Chunking text...");
      const chunks = chunkText(text, maxChunkSize, true);
      await this.log(logPath, `Created ${chunks.length} text chunks`);

      if (chunks.length === 0) {
        throw new Error("Text chunking produced no results");
      }

      // Step 2: Generate chapter titles
      console.log("📑 Generating chapter titles...");
      const chapterTitles = generateChapterTitles(chunks);

      // Step 3: Synthesize audio chunks
      console.log("🗣️ Synthesizing audio...");
      const chunkDir = path.join(episodeDir, "chunks");
      const synthesisResult = await googleTTSService.synthesizeChunksToMp3(
        chunks,
        chunkDir,
        { lang }
      );

      await this.log(
        logPath,
        `Synthesized ${synthesisResult.chunkFiles.length} audio chunks`
      );

      if (synthesisResult.errors.length > 0) {
        await this.log(
          logPath,
          `Synthesis errors: ${synthesisResult.errors.join(", ")}`
        );
      }

      // Step 4: Get durations and build chapters
      console.log("⏱️ Analyzing audio durations...");
      const chapters: Chapter[] = [];
      let currentStartSec = 0;

      for (let i = 0; i < synthesisResult.chunkFiles.length; i++) {
        const chunkFile = synthesisResult.chunkFiles[i];
        const duration = await ffmpegService.getDurationSec(chunkFile);

        chapters.push({
          title: chapterTitles[i] || `Chapter ${i + 1}`,
          startSec: currentStartSec,
          durationSec: duration,
          chunkIndex: i,
        });

        currentStartSec += duration;
      }

      const totalDuration = currentStartSec;
      await this.log(
        logPath,
        `Total duration: ${totalDuration.toFixed(2)} seconds`
      );

      // Step 5: Concatenate audio files
      console.log("🔗 Concatenating audio files...");
      const finalMp3Path = path.join(episodeDir, "final.mp3");

      if (synthesisResult.chunkFiles.length === 1) {
        // Single file, just copy it
        await fs.copyFile(synthesisResult.chunkFiles[0], finalMp3Path);
      } else {
        // Multiple files, concatenate
        await ffmpegService.concatMp3Files(
          synthesisResult.chunkFiles,
          finalMp3Path
        );
      }

      // Step 6: Optional normalization
      if (normalize) {
        console.log("🔊 Normalizing audio...");
        const normalizedPath = path.join(episodeDir, "final_normalized.mp3");
        await ffmpegService.normalizeAudio(finalMp3Path, normalizedPath);
        await fs.rename(normalizedPath, finalMp3Path);
      }

      // Step 7: Create metadata
      const metadata: PodcastMetadata = {
        episodeId,
        title,
        createdAt: new Date().toISOString(),
        lang,
        chapters,
        totalDurationSec: totalDuration,
        chunkFiles: synthesisResult.chunkFiles,
        textLength: text.length,
        finalMp3Path,
      };

      const metadataPath = path.join(episodeDir, "metadata.json");
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;
      await this.log(
        logPath,
        `Generation completed in ${processingTime.toFixed(2)} seconds`
      );

      console.log("✅ Podcast generation completed successfully!");
      console.log(`🎵 Final MP3: ${finalMp3Path}`);
      console.log(`📋 Metadata: ${metadataPath}`);

      return {
        episodeId,
        outPath: finalMp3Path,
        metadataPath,
        chapters,
        metadata,
      };
    } catch (error) {
      await this.log(
        logPath,
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Loads existing podcast metadata
   * @param episodeId - Episode ID to load
   * @returns Podcast metadata or null if not found
   */
  async loadPodcastMetadata(
    episodeId: string
  ): Promise<PodcastMetadata | null> {
    try {
      const episodeDir = path.join(this.baseDir, episodeId);
      const metadataPath = path.join(episodeDir, "metadata.json");

      const metadataContent = await fs.readFile(metadataPath, "utf-8");
      return JSON.parse(metadataContent);
    } catch (error) {
      return null;
    }
  }

  /**
   * Gets the file path for a podcast episode
   * @param episodeId - Episode ID
   * @returns File path or null if not found
   */
  async getPodcastFilePath(episodeId: string): Promise<string | null> {
    try {
      const episodeDir = path.join(this.baseDir, episodeId);
      const finalMp3Path = path.join(episodeDir, "final.mp3");

      await fs.access(finalMp3Path);
      return finalMp3Path;
    } catch (error) {
      return null;
    }
  }

  /**
   * Lists all available podcast episodes
   * @returns Array of episode IDs
   */
  async listEpisodes(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.baseDir);
      const episodes: string[] = [];

      for (const entry of entries) {
        const entryPath = path.join(this.baseDir, entry);
        const stat = await fs.stat(entryPath);

        if (stat.isDirectory()) {
          const metadataPath = path.join(entryPath, "metadata.json");
          try {
            await fs.access(metadataPath);
            episodes.push(entry);
          } catch {
            // Skip directories without metadata
          }
        }
      }

      return episodes;
    } catch (error) {
      return [];
    }
  }

  /**
   * Generates a content hash for caching
   */
  private generateContentHash(
    text: string,
    title: string,
    lang: string
  ): string {
    const content = `${text}|${title}|${lang}`;
    return crypto
      .createHash("sha256")
      .update(content)
      .digest("hex")
      .substring(0, 16);
  }

  /**
   * Checks if a podcast is already cached
   */
  private async checkCache(episodeDir: string): Promise<PodcastResult | null> {
    try {
      const finalMp3Path = path.join(episodeDir, "final.mp3");
      const metadataPath = path.join(episodeDir, "metadata.json");

      await fs.access(finalMp3Path);
      await fs.access(metadataPath);

      const metadataContent = await fs.readFile(metadataPath, "utf-8");
      const metadata: PodcastMetadata = JSON.parse(metadataContent);

      return {
        episodeId: metadata.episodeId,
        outPath: finalMp3Path,
        metadataPath,
        chapters: metadata.chapters,
        metadata,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Logs messages to the episode log file
   */
  private async log(logPath: string, message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    try {
      await fs.appendFile(logPath, logEntry);
    } catch (error) {
      console.error("Failed to write to log:", error);
    }
  }
}

// Export singleton instance
export const podcastService = new PodcastService();
