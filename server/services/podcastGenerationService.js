/**
 * Podcast Generation Service - Complete Pipeline
 *
 * ARCHITECTURE PRINCIPLES:
 * 1. Three states only: pending, ready, failed
 * 2. One generation = one TTS call
 * 3. No regeneration on revisit
 * 4. Real audio duration from metadata
 * 5. Failures are explicit and visible
 */

const supabase = require("../lib/supabaseClient");
const edgeTtsService = require("./edgeTtsService");
const podcastTextService = require("./podcastTextService");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

class PodcastGenerationService {
  /**
   * Create a new podcast (sets status to 'pending')
   */
  async createPodcast(userId, text, options = {}) {
    const { title = "StudySync Podcast", fileId = null, lang = "en" } = options;

    console.log("🎙️  Creating new podcast...");

    try {
      // Step 1: Validate minimum requirements
      const validation = podcastTextService.validateMinimumRequirements(text);
      if (!validation.valid) {
        throw new Error(`Invalid text: ${validation.errors.join(", ")}`);
      }

      // Step 2: Prepare and validate text (apply limits)
      const prepared = await podcastTextService.prepareTextForTTS(text, title);

      // Step 3: Create podcast record in database with 'pending' status
      const { data: podcast, error } = await supabase
        .from("podcasts")
        .insert({
          user_id: userId,
          file_id: fileId,
          title,
          status: "pending",
          tts_text: prepared.text,
          char_count: prepared.charCount,
          word_count: prepared.wordCount,
          lang,
          voice_id: edgeTtsService.getVoiceForLanguage(lang),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`✅ Podcast created with ID: ${podcast.id} (status: pending)`);

      // Step 4: Start generation in background (async)
      this.generateAudioAsync(podcast.id).catch((error) => {
        console.error(`Background generation failed for ${podcast.id}:`, error);
      });

      return {
        success: true,
        podcastId: podcast.id,
        status: "pending",
        wasReduced: prepared.wasReduced,
        metadata: {
          charCount: prepared.charCount,
          wordCount: prepared.wordCount,
          estimatedDurationMinutes: prepared.estimatedDurationMinutes,
        },
      };
    } catch (error) {
      console.error("❌ Failed to create podcast:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate audio for a podcast (async background task)
   * Updates status to 'ready' or 'failed'
   */
  async generateAudioAsync(podcastId) {
    console.log(`🔄 Starting audio generation for podcast ${podcastId}...`);

    try {
      // Fetch podcast record
      const { data: podcast, error: fetchError } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", podcastId)
        .single();

      if (fetchError || !podcast) {
        throw new Error("Podcast not found");
      }

      // Verify status is 'pending'
      if (podcast.status !== "pending") {
        console.log(
          `⚠️  Podcast ${podcastId} status is ${podcast.status}, skipping generation`
        );
        return;
      }

      // Generate audio using Edge-TTS
      const audioResult = await edgeTtsService.generateAudio(podcast.tts_text, {
        lang: podcast.lang,
        voice: podcast.voice_id,
      });

      // Upload audio file to Supabase Storage
      const uploadResult = await this.uploadAudioToStorage(
        podcastId,
        audioResult.filePath
      );

      // Update podcast record to 'ready'
      const { error: updateError } = await supabase
        .from("podcasts")
        .update({
          status: "ready",
          audio_url: uploadResult.publicUrl,
          audio_file_id: uploadResult.fileId,
          duration: audioResult.duration,
          completed_at: new Date().toISOString(),
        })
        .eq("id", podcastId);

      if (updateError) {
        throw new Error(`Failed to update podcast: ${updateError.message}`);
      }

      console.log(
        `✅ Podcast ${podcastId} generation complete (duration: ${audioResult.duration.toFixed(
          2
        )}s)`
      );

      // Clean up temporary file
      try {
        await fs.unlink(audioResult.filePath);
      } catch {}

      return {
        success: true,
        duration: audioResult.duration,
        audioUrl: uploadResult.publicUrl,
      };
    } catch (error) {
      console.error(`❌ Audio generation failed for ${podcastId}:`, error);

      // Update podcast record to 'failed'
      await supabase
        .from("podcasts")
        .update({
          status: "failed",
          error_message: error.message,
        })
        .eq("id", podcastId);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload audio file to Supabase Storage
   */
  async uploadAudioToStorage(podcastId, filePath) {
    console.log(`📤 Uploading audio to Supabase Storage...`);

    try {
      const audioBuffer = await fs.readFile(filePath);
      const fileName = `${podcastId}.mp3`;
      const bucketName = "podcasts";

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      console.log(`✅ Audio uploaded successfully`);

      return {
        fileId: data.path,
        publicUrl,
      };
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  }

  /**
   * Get podcast by ID
   */
  async getPodcast(podcastId) {
    const { data, error } = await supabase
      .from("podcasts")
      .select("*")
      .eq("id", podcastId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      podcast: data,
    };
  }

  /**
   * Get all podcasts for a user
   */
  async getUserPodcasts(userId, options = {}) {
    const { limit = 50, offset = 0, status = null } = options;

    let query = supabase
      .from("podcasts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      podcasts: data,
      count: data.length,
    };
  }

  /**
   * Get podcast by file ID
   */
  async getPodcastByFileId(fileId) {
    const { data, error } = await supabase
      .from("podcasts")
      .select("*")
      .eq("file_id", fileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No podcast found
      if (error.code === "PGRST116") {
        return { success: true, podcast: null, hasPodcast: false };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      podcast: data,
      hasPodcast: true,
    };
  }

  /**
   * Retry failed podcast generation
   */
  async retryPodcast(podcastId) {
    console.log(`🔄 Retrying podcast ${podcastId}...`);

    // Update status to pending
    const { error } = await supabase
      .from("podcasts")
      .update({
        status: "pending",
        error_message: null,
        retry_count: supabase.raw("retry_count + 1"),
      })
      .eq("id", podcastId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Start generation
    this.generateAudioAsync(podcastId).catch((error) => {
      console.error(`Retry failed for ${podcastId}:`, error);
    });

    return { success: true, status: "pending" };
  }

  /**
   * Delete podcast
   */
  async deletePodcast(podcastId) {
    console.log(`🗑️  Deleting podcast ${podcastId}...`);

    try {
      // Get podcast to find audio file
      const { data: podcast } = await supabase
        .from("podcasts")
        .select("audio_file_id")
        .eq("id", podcastId)
        .single();

      // Delete from storage if exists
      if (podcast?.audio_file_id) {
        await supabase.storage.from("podcasts").remove([podcast.audio_file_id]);
      }

      // Delete database record
      const { error } = await supabase
        .from("podcasts")
        .delete()
        .eq("id", podcastId);

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✅ Podcast deleted`);
      return { success: true };
    } catch (error) {
      console.error("Delete failed:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PodcastGenerationService();
