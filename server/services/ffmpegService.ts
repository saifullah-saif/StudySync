import * as path from "path";
import * as fs from "fs/promises";
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("ffmpeg-static");

// Set ffmpeg path to the static binary
ffmpeg.setFfmpegPath(ffmpegStatic);

export interface AudioMetadata {
  duration: number;
  bitrate?: number;
  format?: string;
}

/**
 * FFmpeg service for audio processing operations
 */
export class FFmpegService {
  /**
   * Concatenates multiple MP3 files into a single MP3
   * @param inputFiles - Array of input MP3 file paths
   * @param outputPath - Output file path for the concatenated MP3
   * @returns Promise that resolves when concatenation is complete
   */
  async concatMp3Files(
    inputFiles: string[],
    outputPath: string
  ): Promise<void> {
    if (!inputFiles || inputFiles.length === 0) {
      throw new Error("No input files provided for concatenation");
    }

    if (inputFiles.length === 1) {
      // If only one file, just copy it
      await fs.copyFile(inputFiles[0], outputPath);
      return;
    }

    console.log(`🔗 Concatenating ${inputFiles.length} MP3 files...`);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Add all input files
      inputFiles.forEach((file) => {
        command = command.input(file);
      });

      command
        .on("start", (commandLine) => {
          console.log("FFmpeg process started:", commandLine);
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`Processing: ${Math.round(progress.percent)}% done`);
          }
        })
        .on("end", () => {
          console.log("✅ Audio concatenation completed");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err);
          reject(new Error(`FFmpeg concatenation failed: ${err.message}`));
        })
        .audioCodec("libmp3lame")
        .audioChannels(1) // Mono for smaller file size
        .audioBitrate("128k")
        .format("mp3")
        .save(outputPath);
    });
  }

  /**
   * Gets the duration of an audio file in seconds
   * @param filePath - Path to the audio file
   * @returns Promise that resolves to duration in seconds
   */
  async getDurationSec(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
        if (err) {
          console.error("FFprobe error:", err);
          reject(new Error(`Failed to get duration: ${err.message}`));
          return;
        }

        const duration = metadata?.format?.duration;
        if (typeof duration === "number") {
          resolve(duration);
        } else {
          reject(new Error("Could not determine audio duration"));
        }
      });
    });
  }

  /**
   * Gets detailed metadata for an audio file
   * @param filePath - Path to the audio file
   * @returns Promise that resolves to audio metadata
   */
  async getAudioMetadata(filePath: string): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
        if (err) {
          reject(new Error(`Failed to get metadata: ${err.message}`));
          return;
        }

        const format = metadata?.format;
        resolve({
          duration: format?.duration || 0,
          bitrate: format?.bit_rate ? parseInt(format.bit_rate) : undefined,
          format: format?.format_name,
        });
      });
    });
  }

  /**
   * Normalizes audio volume using loudnorm filter
   * @param inputPath - Input file path
   * @param outputPath - Output file path
   * @returns Promise that resolves when normalization is complete
   */
  async normalizeAudio(inputPath: string, outputPath: string): Promise<void> {
    console.log("🔊 Normalizing audio volume...");

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters("loudnorm")
        .on("start", (commandLine) => {
          console.log("FFmpeg normalization started:", commandLine);
        })
        .on("end", () => {
          console.log("✅ Audio normalization completed");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ Audio normalization error:", err);
          reject(new Error(`Audio normalization failed: ${err.message}`));
        })
        .save(outputPath);
    });
  }

  /**
   * Creates silence audio file for padding or placeholders
   * @param durationSec - Duration in seconds
   * @param outputPath - Output file path
   */
  async createSilence(durationSec: number, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(
          `anullsrc=duration=${durationSec}:sample_rate=44100:channel_layout=mono`
        )
        .inputFormat("lavfi")
        .audioCodec("libmp3lame")
        .audioBitrate("128k")
        .on("end", () => {
          console.log(`✅ Created ${durationSec}s silence file`);
          resolve();
        })
        .on("error", (err) => {
          reject(new Error(`Failed to create silence: ${err.message}`));
        })
        .save(outputPath);
    });
  }
}

// Export singleton instance
export const ffmpegService = new FFmpegService();
