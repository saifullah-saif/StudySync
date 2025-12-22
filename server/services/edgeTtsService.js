/**
 * Edge-TTS Service for Free Text-to-Speech Conversion
 * Uses Microsoft Edge's TTS engine - completely free, high quality
 *
 * CRITICAL RULES:
 * - One generation = one TTS call
 * - No retries without user action
 * - No regeneration for same content
 * - Audio duration must come from actual file metadata
 */

const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const ffmpeg = require("fluent-ffmpeg");

// Available voices (high quality, natural sounding)
const VOICES = {
  "en-US": "en-US-AriaNeural", // Female, natural
  "en-GB": "en-GB-SoniaNeural", // Female, British
  "en-AU": "en-AU-NatashaNeural", // Female, Australian
  es: "es-ES-ElviraNeural", // Spanish
  fr: "fr-FR-DeniseNeural", // French
  de: "de-DE-KatjaNeural", // German
};

class EdgeTtsService {
  constructor() {
    this.tempDir = "/tmp/studysync-podcasts";
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create temp directory:", error);
    }
  }

  /**
   * Check if edge-tts is installed
   */
  async checkInstallation() {
    try {
      await execAsync("edge-tts --version");
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate audio from text (ONE TIME ONLY)
   * Returns path to generated MP3 file
   */
  async generateAudio(text, options = {}) {
    const {
      lang = "en-US",
      voice = VOICES[lang] || VOICES["en-US"],
      rate = "+0%",
      outputPath = null,
    } = options;

    console.log("🎙️  Generating audio with Edge-TTS...");
    console.log(`  Text length: ${text.length} characters`);
    console.log(`  Voice: ${voice}`);

    // Check installation
    const isInstalled = await this.checkInstallation();
    if (!isInstalled) {
      throw new Error(
        "edge-tts is not installed. Install with: pip install edge-tts"
      );
    }

    // Generate unique filename
    const textHash = crypto.createHash("md5").update(text).digest("hex");
    const filename = outputPath || path.join(this.tempDir, `${textHash}.mp3`);

    // Check if already generated (prevents double generation)
    try {
      await fs.access(filename);
      console.log("✅ Audio already exists (cache hit), skipping generation");
      const duration = await this.getAudioDuration(filename);
      return { filePath: filename, duration, wasCached: true };
    } catch {
      // File doesn't exist, proceed with generation
    }

    try {
      // Generate audio using edge-tts CLI
      const command = `edge-tts --text "${this.escapeText(
        text
      )}" --voice "${voice}" --rate="${rate}" --write-media "${filename}"`;

      console.log("🔄 Running edge-tts...");
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr && !stderr.includes("INFO")) {
        console.warn("⚠️  edge-tts stderr:", stderr);
      }

      // Verify file was created
      await fs.access(filename);

      // Get actual duration from audio file metadata
      const duration = await this.getAudioDuration(filename);

      console.log("✅ Audio generation complete");
      console.log(`  File: ${filename}`);
      console.log(`  Duration: ${duration.toFixed(2)} seconds`);

      return {
        filePath: filename,
        duration,
        wasCached: false,
      };
    } catch (error) {
      console.error("❌ Edge-TTS generation failed:", error.message);

      // Clean up partial file if it exists
      try {
        await fs.unlink(filename);
      } catch {}

      throw new Error(
        `TTS generation failed: ${error.message}. Ensure edge-tts is installed: pip install edge-tts`
      );
    }
  }

  /**
   * Get actual audio duration from file metadata using ffmpeg
   * NO ESTIMATION - uses real audio file metadata
   */
  async getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(
            new Error(`Failed to get audio duration: ${err.message}`)
          );
          return;
        }

        const duration = metadata.format.duration;
        if (!duration || isNaN(duration)) {
          reject(new Error("Invalid audio duration in metadata"));
          return;
        }

        resolve(duration);
      });
    });
  }

  /**
   * Escape text for shell command
   */
  escapeText(text) {
    return text.replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\n/g, " ");
  }

  /**
   * List available voices
   */
  async listVoices() {
    try {
      const { stdout } = await execAsync("edge-tts --list-voices");
      return stdout;
    } catch (error) {
      console.error("Failed to list voices:", error);
      return null;
    }
  }

  /**
   * Get default voice for language
   */
  getVoiceForLanguage(lang) {
    return VOICES[lang] || VOICES["en-US"];
  }

  /**
   * Clean up old temporary files
   */
  async cleanup(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          console.log(`🗑️  Deleted old file: ${file}`);
        }
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  }
}

module.exports = new EdgeTtsService();
