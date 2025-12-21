"use client";

/**
 * Professional Podcast Player with Text-to-Speech
 * - Single continuous playback
 * - Working seek/scrub functionality
 * - Modern, professional UI
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Loader2,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";

interface SimplePodcastPlayerProps {
  fullText: string;
  title?: string;
  episodeId?: string;
  className?: string;
  estimatedDuration?: number;
}

export default function SimplePodcastPlayer({
  fullText,
  title = "Podcast",
  className = "",
  estimatedDuration = 0,
}: SimplePodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(estimatedDuration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetSeekTimeRef = useRef<number | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const currentChunksRef = useRef<string[]>([]);
  const currentChunkIndexRef = useRef<number>(0);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window === "undefined") {
      console.error("❌ Window is undefined - not in browser environment");
      return;
    }

    console.log("🎤 Initializing speech synthesis...");
    console.log("📝 Full text length:", fullText?.length || 0);
    console.log("⏱️ Estimated duration:", estimatedDuration);

    if (!window.speechSynthesis) {
      console.error("❌ Speech synthesis not supported in this browser");
      toast.error("Speech synthesis not supported in this browser");
      return;
    }

    synthRef.current = window.speechSynthesis;
    console.log("✅ Speech synthesis API available");

    // Load voices with multiple attempts
    const loadVoices = () => {
      if (!synthRef.current) return;

      const voices = synthRef.current.getVoices();
      console.log(`🔊 Loaded ${voices.length} voices`);

      if (voices.length > 0) {
        console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
        setVoicesLoaded(true);
        console.log("✅ Voices loaded successfully");
      }
    };

    // Try loading immediately
    loadVoices();

    // Also listen for voiceschanged event
    if (synthRef.current) {
      synthRef.current.addEventListener("voiceschanged", loadVoices);
    }

    // Fallback: Force enable after delay
    const timeout = setTimeout(() => {
      console.log("⏰ Fallback timeout reached - force enabling voices");
      setVoicesLoaded(true);
      console.log("✅ Voices force-enabled (fallback)");
    }, 1500);

    return () => {
      clearTimeout(timeout);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      stopTimer();
    };
  }, [fullText, estimatedDuration]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start timer to track progress
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - elapsedTimeRef.current * 1000;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      elapsedTimeRef.current = elapsed;

      if (!isSeeking) {
        setCurrentTime(Math.min(elapsed, duration));
      }

      if (elapsed >= duration) {
        stopPlayback();
      }
    }, 100);
  }, [duration, isSeeking]);

  // Stop timer
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Stop playback completely
  const stopPlayback = useCallback(() => {
    console.log("🛑 Stopping playback");
    isStoppingRef.current = true;

    if (synthRef.current) {
      synthRef.current.cancel();
    }

    stopTimer();
    setIsPlaying(false);
    setIsLoading(false);

    // Small delay to ensure cancel completes
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 100);
  }, []);

  // Start/resume speech at specific time
  const startSpeech = useCallback(
    (fromTime: number = 0) => {
      console.log("🎬 startSpeech called", { fromTime, hassynth: !!synthRef.current, textLength: fullText?.length });

      if (!synthRef.current) {
        console.error("❌ Speech synthesis reference is null");
        toast.error("Speech synthesis not initialized. Please reload the page.");
        return;
      }

      if (!fullText || fullText.trim().length === 0) {
        console.error("❌ No text content to speak");
        toast.error("No text content available for podcast");
        return;
      }

      // Cancel any existing speech
      synthRef.current.cancel();

      setIsLoading(true);

      // Calculate what portion of text to speak
      const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
      const totalSentences = sentences.length;

      // Calculate starting sentence based on time
      const sentencesPerSecond = totalSentences / duration;
      const startSentenceIndex = Math.floor(fromTime * sentencesPerSecond);

      // Get sentences from start position to end
      const sentencesToSpeak = sentences.slice(startSentenceIndex);
      const textToSpeak = sentencesToSpeak.join(" ");

      console.log(`📊 Text calculation: ${totalSentences} sentences, starting at sentence ${startSentenceIndex}, speaking ${sentencesToSpeak.length} sentences`);

      if (!textToSpeak || textToSpeak.trim().length === 0) {
        toast.info("Reached end of podcast");
        stopPlayback();
        return;
      }

      // Chunk text to avoid browser limits (max ~32KB or 200-300 words per chunk)
      const MAX_CHARS = 5000; // Conservative limit for browser compatibility
      const chunks: string[] = [];

      let currentChunk = "";
      for (const sentence of sentencesToSpeak) {
        if ((currentChunk + sentence).length > MAX_CHARS && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? " " : "") + sentence;
        }
      }
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }

      console.log(`📦 Split into ${chunks.length} chunks for playback`);

      // Store chunks in ref for access across the component
      currentChunksRef.current = chunks;
      currentChunkIndexRef.current = 0;

      const speakChunk = (chunkIndex: number) => {
        // Check if we're stopping (user cancelled or seeking)
        if (isStoppingRef.current) {
          console.log("⏸️ Playback was stopped, not continuing");
          return;
        }

        if (!synthRef.current || chunkIndex >= chunks.length) {
          console.log("⏹️ All chunks spoken");
          stopPlayback();
          setCurrentTime(duration);
          elapsedTimeRef.current = duration;
          toast.info("Podcast ended");
          return;
        }

        const chunk = chunks[chunkIndex];
        console.log(`🔊 Speaking chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} chars)`);

        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.rate = 1.1; // Slightly faster for better listening experience
        utterance.pitch = 1.0;
        utterance.volume = isMuted ? 0 : volume;
        utterance.lang = "en-US";

        // Select best voice - prioritize natural-sounding voices
        const voices = synthRef.current.getVoices();

        // Prioritize high-quality voices
        const preferredVoice =
          voices.find((v) => v.name.includes("Samantha") && v.lang === "en-US") || // macOS high-quality voice
          voices.find((v) => v.name.includes("Google US English") && v.lang === "en-US") || // Google voices
          voices.find((v) => v.name.includes("Microsoft") && v.name.includes("Online") && v.lang === "en-US") || // Microsoft Online voices
          voices.find((v) => v.name.includes("Natural") && v.lang.startsWith("en")) || // Natural voices
          voices.find((v) => !v.name.includes("Compact") && v.lang === "en-US") || // Avoid compact voices
          voices.find((v) => v.lang === "en-US") ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
          if (chunkIndex === 0) {
            console.log(`✅ Using voice: ${preferredVoice.name} (${preferredVoice.lang})`);
          }
        } else {
          console.warn("⚠️ No voice selected, using default");
        }

        utterance.onstart = () => {
          if (chunkIndex === 0) {
            console.log("▶️ Speech started");
            setIsLoading(false);
            setIsPlaying(true);
            elapsedTimeRef.current = fromTime;
            startTimer();
            toast.success("Playing podcast");
          }
        };

        utterance.onend = () => {
          // Check if we're stopping before continuing
          if (isStoppingRef.current) {
            console.log("⏸️ Stopping detected in onend, not continuing");
            return;
          }

          console.log(`✅ Chunk ${chunkIndex + 1} completed`);
          // Speak next chunk
          currentChunkIndexRef.current = chunkIndex + 1;
          speakChunk(chunkIndex + 1);
        };

        utterance.onerror = (event) => {
          // If we're stopping (user cancelled/seeked), ignore all errors
          if (isStoppingRef.current) {
            console.log(`⏸️ Chunk ${chunkIndex + 1} stopped (user action - stopping flag set)`);
            return;
          }

          // "interrupted" error happens when user stops/seeks - this is intentional
          if (event.error === "interrupted") {
            console.log(`⏸️ Chunk ${chunkIndex + 1} interrupted (user action)`);
            return; // Don't continue or show error for intentional interruptions
          }

          // Log other errors with details
          console.error(`❌ Speech error on chunk ${chunkIndex + 1}:`, {
            error: event.error,
            charIndex: event.charIndex,
            elapsedTime: event.elapsedTime,
            chunkLength: chunk.length
          });

          // Handle specific error types
          switch (event.error) {
            case "audio-busy":
            case "audio-hardware":
              toast.error("Audio device is busy. Please try again.");
              stopPlayback();
              break;

            case "network":
              toast.error("Network error. Check your connection.");
              stopPlayback();
              break;

            case "synthesis-unavailable":
            case "synthesis-failed":
              // Try next chunk for synthesis failures
              if (chunkIndex < chunks.length - 1) {
                console.log(`⚠️ Synthesis failed for chunk ${chunkIndex + 1}, trying next chunk`);
                currentChunkIndexRef.current = chunkIndex + 1;
                setTimeout(() => speakChunk(chunkIndex + 1), 100);
              } else {
                toast.error("Speech synthesis failed");
                stopPlayback();
              }
              break;

            case "text-too-long":
              console.warn(`⚠️ Chunk ${chunkIndex + 1} too long, trying next chunk`);
              if (chunkIndex < chunks.length - 1) {
                currentChunkIndexRef.current = chunkIndex + 1;
                setTimeout(() => speakChunk(chunkIndex + 1), 100);
              }
              break;

            default:
              // For other errors, try to continue if possible
              if (chunkIndex < chunks.length - 1) {
                console.log(`⚠️ Error in chunk ${chunkIndex + 1}, trying next chunk`);
                currentChunkIndexRef.current = chunkIndex + 1;
                setTimeout(() => speakChunk(chunkIndex + 1), 100);
              } else {
                toast.error(`Playback error: ${event.error}`);
                stopPlayback();
              }
          }
        };

        utteranceRef.current = utterance;

        try {
          if (!synthRef.current) {
            console.error("❌ Speech synthesis lost during chunking");
            return;
          }
          synthRef.current.speak(utterance);
        } catch (error) {
          console.error(`❌ Error speaking chunk ${chunkIndex + 1}:`, error);
          toast.error("Failed to play audio chunk");
          setIsLoading(false);
        }
      };

      // Reset stopping flag and start speaking
      isStoppingRef.current = false;
      speakChunk(0);
    },
    [fullText, duration, volume, isMuted, startTimer, stopPlayback]
  );

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
      toast.info("Paused");
    } else {
      if (targetSeekTimeRef.current !== null) {
        startSpeech(targetSeekTimeRef.current);
        targetSeekTimeRef.current = null;
      } else {
        startSpeech(currentTime);
      }
    }
  };

  // Handle seek
  const handleSeekChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    setIsSeeking(true);
  };

  const handleSeekEnd = (value: number[]) => {
    setIsSeeking(false);
    const newTime = value[0];
    setCurrentTime(newTime);
    targetSeekTimeRef.current = newTime;
    elapsedTimeRef.current = newTime;

    console.log(`🎯 Seeking to ${formatTime(newTime)}`);

    // Stop current playback
    if (isPlaying) {
      stopPlayback();
    }

    // Wait a bit for cancel to complete before starting new speech
    setTimeout(() => {
      startSpeech(newTime);
      toast.info(`Jumped to ${formatTime(newTime)}`);
    }, 150);
  };

  // Volume control
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(0.8);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Reset
  const resetToBeginning = () => {
    stopPlayback();
    setCurrentTime(0);
    elapsedTimeRef.current = 0;
    targetSeekTimeRef.current = null;
    toast.info("Reset to start");
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className={`w-full border-0 shadow-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 ${className}`}>
      <CardContent className="p-8 space-y-8">
        {/* Header with Icon */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <Headphones className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI-Powered Podcast
            </p>
          </div>
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-between text-lg font-semibold">
          <span className="text-blue-600 dark:text-blue-400">
            {formatTime(currentTime)}
          </span>
          <span className="text-sm text-gray-400 font-normal">
            {progressPercent.toFixed(0)}%
          </span>
          <span className="text-gray-600 dark:text-gray-300">
            {formatTime(duration)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeekChange}
            onValueCommit={handleSeekEnd}
            disabled={isLoading}
            className="cursor-pointer"
          />
          <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20"></div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6">
          <Button
            onClick={resetToBeginning}
            variant="outline"
            size="lg"
            disabled={isLoading}
            className="h-14 w-14 rounded-full border-2 hover:scale-110 transition-transform shadow-md"
            title="Reset to beginning"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          <Button
            onClick={togglePlayPause}
            disabled={isLoading || !voicesLoaded}
            size="lg"
            className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-purple-700 hover:to-pink-700 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-9 w-9 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="h-9 w-9 text-white" />
            ) : (
              <Play className="h-9 w-9 text-white ml-1" />
            )}
          </Button>

          <Button
            onClick={toggleMute}
            variant="outline"
            size="lg"
            className="h-14 w-14 rounded-full border-2 hover:scale-110 transition-transform shadow-md"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-4 max-w-xs mx-auto">
          <VolumeX className="h-4 w-4 text-gray-400" />
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
          <Volume2 className="h-4 w-4 text-gray-400" />
        </div>

        {/* Status Messages */}
        {!voicesLoaded && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Initializing audio system...</span>
            </div>
          </div>
        )}

        {voicesLoaded && !isPlaying && !isLoading && currentTime === 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Press play to start listening to your podcast
          </div>
        )}
      </CardContent>
    </Card>
  );
}
