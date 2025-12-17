/**
 * Client-side API functions for podcast operations
 */

export interface PodcastGenerationRequest {
  text?: string;
  fileId?: string | number;
  title?: string;
  lang?: string;
}

export interface PodcastGenerationResponse {
  success: boolean;
  episodeId?: string;
  audioUrl?: string;
  metadataUrl?: string;
  chapters?: Array<{
    title: string;
    startSec: number;
    durationSec: number;
    chunkIndex: number;
  }>;
  duration?: number;
  title?: string;
  error?: string;
  demoMode?: boolean;
  message?: string;
  textChunks?: string[];
}

export interface PodcastMetadata {
  episodeId: string;
  title: string;
  createdAt: string;
  lang: string;
  chapters: Array<{
    title: string;
    startSec: number;
    durationSec: number;
    chunkIndex: number;
  }>;
  totalDurationSec: number;
  textLength: number;
}

export interface PodcastMetadataResponse {
  success: boolean;
  metadata?: PodcastMetadata;
  error?: string;
}

export interface Episode {
  episodeId: string;
  title: string;
  createdAt: string;
  duration: number;
  chapters: number;
}

export interface EpisodesListResponse {
  success: boolean;
  episodes?: Episode[];
  error?: string;
}

/**
 * Podcast API client functions
 */
export const podcastAPI = {
  /**
   * Generate a podcast from text
   */
  async generatePodcast(
    request: PodcastGenerationRequest
  ): Promise<PodcastGenerationResponse> {
    try {
      const response = await fetch("/api/podcasts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
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
   * Get podcast metadata
   */
  async getPodcastMetadata(
    episodeId: string
  ): Promise<PodcastMetadataResponse> {
    try {
      const response = await fetch(`/api/podcasts/metadata/${episodeId}`);
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
   * Get list of all podcast episodes
   */
  async getEpisodesList(): Promise<EpisodesListResponse> {
    try {
      const response = await fetch("/api/podcasts/generate");
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
   * Get download URL for a podcast
   */
  getDownloadUrl(episodeId: string): string {
    return `/api/podcasts/download/${episodeId}`;
  },

  /**
   * Get audio URL for streaming
   */
  getAudioUrl(episodeId: string): string {
    return `/api/podcasts/download/${episodeId}`;
  },

  /**
   * Download a podcast episode
   */
  async downloadPodcast(episodeId: string, title?: string): Promise<void> {
    try {
      const downloadUrl = this.getDownloadUrl(episodeId);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = title
        ? `${title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_")}.mp3`
        : `podcast_${episodeId}.mp3`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Download failed"
      );
    }
  },
};
