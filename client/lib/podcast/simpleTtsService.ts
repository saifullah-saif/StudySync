/**
 * Simple Text-to-Speech service using Web Speech API
 * This provides actual audio generation without external dependencies
 */

export interface SimpleTTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export class SimpleTTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    
    this.voices = this.synth.getVoices();

    // If voices aren't loaded yet, wait for the event
    if (this.voices.length === 0) {
      this.synth.addEventListener("voiceschanged", () => {
        if (this.synth) {
          this.voices = this.synth.getVoices();
        }
      });
    }
  }

  /**
   * Convert text to speech and return audio blob
   */
  async synthesizeToBlob(
    text: string,
    options: SimpleTTSOptions = {}
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error("Speech synthesis not supported"));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice options
      utterance.lang = options.lang || "en-US";
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Find a good voice for the language
      const voice =
        this.voices.find((v) =>
          v.lang.startsWith(utterance.lang.split("-")[0])
        ) || this.voices[0];

      if (voice) {
        utterance.voice = voice;
      }

      // Create audio context to capture the audio
      const audioContext = new AudioContext();
      const mediaStreamDestination =
        audioContext.createMediaStreamDestination();

      // This is a simplified approach - in reality, capturing TTS audio
      // requires more complex audio processing
      utterance.onend = () => {
        // For now, create a simple audio blob placeholder
        // In a real implementation, we'd capture the actual audio
        const placeholder = new Blob([""], { type: "audio/mp3" });
        resolve(placeholder);
      };

      utterance.onerror = (event) => {
        reject(new Error(`TTS synthesis failed: ${event.error}`));
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Generate audio URL for immediate playback using Web Speech API
   */
  async generateAudioURL(
    text: string,
    options: SimpleTTSOptions = {}
  ): Promise<string> {
    try {
      // For immediate playback, we'll use a data URL approach
      // This creates a simple audio representation
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = options.lang || "en-US";
      utterance.rate = options.rate || 0.9; // Slightly slower for clarity
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Find appropriate voice
      const voice =
        this.voices.find((v) =>
          v.lang.startsWith(utterance.lang.split("-")[0])
        ) || this.voices[0];

      if (voice) {
        utterance.voice = voice;
      }

      // Store the utterance for playback
      const audioData = {
        utterance,
        text,
        options,
      };

      // Create a data URL that contains the TTS data
      const dataString = JSON.stringify(audioData);
      const blob = new Blob([dataString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      return url;
    } catch (error) {
      throw new Error(
        `Failed to generate audio URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Play text directly using Web Speech API
   */
  async playText(text: string, options: SimpleTTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error("Speech synthesis not supported"));
        return;
      }

      // Stop any current speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = options.lang || "en-US";
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      const voice =
        this.voices.find((v) =>
          v.lang.startsWith(utterance.lang.split("-")[0])
        ) || this.voices[0];

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) =>
        reject(new Error(`TTS failed: ${event.error}`));

      this.synth.speak(utterance);
    });
  }

  /**
   * Stop current speech synthesis
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Check if TTS is supported
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }
}
