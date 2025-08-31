/**
 * FFmpeg Service for audio processing and concatenation
 * Uses ffmpeg-static for local audio manipulation
 */

import ffmpeg from "fluent-ffmpeg";
// @ts-ignore
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import path from "path";
import { AudioChunk } from "./googleTtsService";

// Set FFmpeg binary path
ffmpeg.setFfmpegPath(ffmpegPath);

export interface ConcatenationOptions {
  normalize?: boolean;
  addSilence?: boolean;
  silenceDuration?: number; // seconds
  outputFormat?: string;
}

const DEFAULT_CONCAT_OPTIONS: Required<ConcatenationOptions> = {
  normalize: false,
  addSilence: true,
  silenceDuration: 0.5,
  outputFormat: "mp3",
};

export class FFmpegService {
  /**
   * Concatenate multiple MP3 files into a single file
   */
  async concatMp3Files(
    audioChunks: AudioChunk[],
    outputPath: string,
    options: ConcatenationOptions = {}
  ): Promise<{ outputPath: string; totalDuration: number }> {
    const opts = { ...DEFAULT_CONCAT_OPTIONS, ...options };

    if (audioChunks.length === 0) {
      throw new Error("No audio chunks provided for concatenation");
    }

    console.log(`🔗 Concatenating ${audioChunks.length} audio files...`);

    // Create temporary file list for FFmpeg
    const listFilePath = path.join(path.dirname(outputPath), "concat_list.txt");

    try {
      // Create file list
      const fileList = audioChunks
        .sort((a, b) => a.index - b.index)
        .map((chunk) => {
          if (!fs.existsSync(chunk.filePath)) {
            throw new Error(`Audio file not found: ${chunk.filePath}`);
          }
          return `file '${chunk.filePath}'`;
        })
        .join("\n");

      fs.writeFileSync(listFilePath, fileList);

      // Build FFmpeg command
      const command = ffmpeg();

      // Input: file list
      command.input(listFilePath).inputOptions(["-f", "concat", "-safe", "0"]);

      // Audio codec and quality
      command
        .audioCodec("mp3")
        .audioBitrate("128k")
        .audioChannels(1) // Mono for smaller file size
        .audioFrequency(22050); // Lower sample rate for smaller size

      // Normalization (optional)
      if (opts.normalize) {
        command.audioFilters(["loudnorm=I=-16:LRA=11:TP=-1.5"]);
      }

      // Output options
      command.format(opts.outputFormat).output(outputPath);

      // Execute concatenation
      await new Promise<void>((resolve, reject) => {
        command
          .on("start", (commandLine) => {
            console.log("🎵 FFmpeg command:", commandLine);
          })
          .on("progress", (progress) => {
            if (progress.percent) {
              console.log(
                `⏳ Concatenation progress: ${Math.round(progress.percent)}%`
              );
            }
          })
          .on("end", () => {
            console.log("✅ Audio concatenation completed");
            resolve();
          })
          .on("error", (error) => {
            console.error("❌ FFmpeg error:", error);
            reject(new Error(`Audio concatenation failed: ${error.message}`));
          })
          .run();
      });

      // Calculate total duration
      const totalDuration = audioChunks.reduce(
        (sum, chunk) => sum + chunk.duration,
        0
      );

      // Cleanup
      if (fs.existsSync(listFilePath)) {
        fs.unlinkSync(listFilePath);
      }

      console.log(
        `🎉 Concatenation completed: ${outputPath} (${totalDuration}s)`
      );

      return {
        outputPath,
        totalDuration,
      };
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(listFilePath)) {
        fs.unlinkSync(listFilePath);
      }

      console.error("❌ Concatenation error:", error);
      throw error;
    }
  }

  /**
   * Get audio file duration in seconds
   */
  async getDurationSec(filePath: string): Promise<number> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error, metadata) => {
        if (error) {
          reject(new Error(`Failed to get duration: ${error.message}`));
        } else if (metadata?.format?.duration) {
          resolve(Math.ceil(metadata.format.duration));
        } else {
          reject(new Error("Could not determine audio duration"));
        }
      });
    });
  }

  /**
   * Normalize audio levels
   */
  async normalizeAudio(inputPath: string, outputPath: string): Promise<void> {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    console.log("🎚️ Normalizing audio levels...");

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(["loudnorm=I=-16:LRA=11:TP=-1.5"])
        .output(outputPath)
        .on("end", () => {
          console.log("✅ Audio normalization completed");
          resolve();
        })
        .on("error", (error) => {
          console.error("❌ Normalization error:", error);
          reject(new Error(`Audio normalization failed: ${error.message}`));
        })
        .run();
    });
  }

  /**
   * Create silence audio file
   */
  async createSilence(duration: number, outputPath: string): Promise<void> {
    console.log(`🔇 Creating ${duration}s silence...`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input("anullsrc=channel_layout=mono:sample_rate=22050")
        .inputOptions(["-f", "lavfi"])
        .duration(duration)
        .audioCodec("mp3")
        .audioBitrate("128k")
        .output(outputPath)
        .on("end", () => {
          console.log("✅ Silence created");
          resolve();
        })
        .on("error", (error) => {
          console.error("❌ Silence creation error:", error);
          reject(new Error(`Failed to create silence: ${error.message}`));
        })
        .run();
    });
  }

  /**
   * Convert audio format
   */
  async convertFormat(
    inputPath: string,
    outputPath: string,
    format: "mp3" | "wav" | "m4a" = "mp3"
  ): Promise<void> {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    console.log(`🔄 Converting to ${format.toUpperCase()}...`);

    const codecMap = {
      mp3: "mp3",
      wav: "pcm_s16le",
      m4a: "aac",
    };

    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .audioCodec(codecMap[format])
        .output(outputPath);

      // Format-specific options
      if (format === "mp3") {
        command.audioBitrate("128k");
      } else if (format === "m4a") {
        command.audioBitrate("128k");
      }

      command
        .on("end", () => {
          console.log(`✅ Conversion to ${format} completed`);
          resolve();
        })
        .on("error", (error) => {
          console.error(`❌ Conversion error:`, error);
          reject(new Error(`Format conversion failed: ${error.message}`));
        })
        .run();
    });
  }

  /**
   * Get audio metadata
   */
  async getAudioMetadata(filePath: string): Promise<any> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error, metadata) => {
        if (error) {
          reject(new Error(`Failed to get metadata: ${error.message}`));
        } else {
          resolve(metadata);
        }
      });
    });
  }
}
