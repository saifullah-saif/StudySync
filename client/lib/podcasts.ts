/**
 * Client-side API functions for podcast operations
 * Audio-based TTS architecture with real audio files
 */

export type PodcastStatus = "pending" | "ready" | "failed";

export interface PodcastGenerationRequest {
  text: string;
  fileId?: string | number;
  title?: string;
  lang?: string;
  userId: string;
}

export interface PodcastGenerationResponse {
  success: boolean;
  podcastId?: string;
  status?: PodcastStatus;
  wasReduced?: boolean;
  metadata?: {
    charCount: number;
    wordCount: number;
    estimatedDurationMinutes: number;
  };
  error?: string;
}

export interface Podcast {
  id: string;
  user_id: string;
  file_id?: string;
  title: string;
  status: PodcastStatus;
  tts_text: string;
  char_count: number;
  word_count: number;
  audio_url?: string;
  audio_file_id?: string;
  duration?: number;
  voice_id: string;
  lang: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface PodcastResponse {
  success: boolean;
  podcast?: Podcast;
  error?: string;
}

export interface PodcastsListResponse {
  success: boolean;
  podcasts?: Podcast[];
  count?: number;
  error?: string;
}

/**
 * Podcast API client functions
 */
export const podcastAPI = {
  /**
   * Create a new podcast (starts generation in background)
   */
  async createPodcast(
    request: PodcastGenerationRequest
  ): Promise<PodcastGenerationResponse> {
    try {
      console.log("📡 Creating podcast...", request);

      const response = await fetch("/api/server/podcasts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      console.log("📥 Response status:", response.status);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Non-JSON response:", text.substring(0, 200));
        return {
          success: false,
          error: `Server returned non-JSON response (${response.status}). Is the Express backend running on port 5001?`,
        };
      }

      const data = await response.json();
      console.log("📥 Response data:", data);

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      console.error("❌ Podcast creation error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },

  /**
   * Check if a podcast exists for a specific file
   */
  async getPodcastByFileId(
    fileId: string | number
  ): Promise<PodcastResponse & { hasPodcast: boolean }> {
    try {
      const response = await fetch(`/api/server/podcasts/file/${fileId}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
          hasPodcast: false,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
        hasPodcast: false,
      };
    }
  },

  /**
   * Get a specific podcast by ID
   */
  async getPodcast(podcastId: string): Promise<PodcastResponse> {
    try {
      const response = await fetch(`/api/server/podcasts/${podcastId}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },

  /**
   * Get all podcasts for a user
   */
  async getUserPodcasts(userId: string): Promise<PodcastsListResponse> {
    try {
      const response = await fetch(
        `/api/server/podcasts?userId=${encodeURIComponent(userId)}`
      );
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },

  /**
   * Retry failed podcast generation
   */
  async retryPodcast(podcastId: string): Promise<PodcastResponse> {
    try {
      const response = await fetch(`/api/server/podcasts/${podcastId}/retry`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },

  /**
   * Delete a podcast
   */
  async deletePodcast(podcastId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/server/podcasts/${podcastId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error:
            data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  },

  /**
   * Poll for podcast status (use when status is 'pending')
   */
  async pollPodcastStatus(
    podcastId: string,
    intervalMs: number = 3000,
    maxAttempts: number = 100
  ): Promise<Podcast | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getPodcast(podcastId);

      if (result.success && result.podcast) {
        const status = result.podcast.status;

        if (status === "ready" || status === "failed") {
          return result.podcast;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return null;
  },
};
