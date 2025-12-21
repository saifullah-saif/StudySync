/**
 * Real-time TTS Audio Player using Web Speech API
 * Provides actual audio playback without external dependencies
 */

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Download,
  Volume2,
  SkipBack,
  SkipForward,
  Clock,
  List,
  Mic,
} from "lucide-react";
import { toast } from "sonner";

export interface Chapter {
  title: string;
  startSec: number;
  durationSec: number;
  chunkIndex: number;
  index?: number;
  text?: string;
}

interface LiveTTSPlayerProps {
  chapters: Chapter[];
  title?: string;
  episodeId?: string;
  className?: string;
  textChunks?: string[]; // Array of text content for each chapter
}

export default function LiveTTSPlayer({
  chapters = [],
  title = "Podcast",
  episodeId,
  className = "",
  textChunks = [],
}: LiveTTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentChapter, setCurrentChapter] = useState<number>(0);
  const [showChapters, setShowChapters] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [currentUtterance, setCurrentUtterance] =
    useState<SpeechSynthesisUtterance | null>(null);

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate total duration from chapters
  useEffect(() => {
    const totalDuration = chapters.reduce(
      (sum, chapter) => sum + chapter.durationSec,
      0
    );
    setDuration(totalDuration || 180);
  }, [chapters]);

  // Timer to track progress during TTS playback
  const startProgressTimer = () => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      if (isPlaying) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setCurrentTime((prev) => {
          const newTime = Math.min(duration, prev + 1);

          // Check if we should move to next chapter
          if (chapters.length > 0 && currentChapter < chapters.length - 1) {
            const nextChapter = chapters[currentChapter + 1];
            if (newTime >= nextChapter.startSec) {
              setCurrentChapter(currentChapter + 1);
            }
          }

          return newTime;
        });
      }
    }, 1000);
  };

  const stopProgressTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const togglePlayPause = () => {
    if (!synth) {
      toast.error("Speech synthesis not supported in this browser");
      return;
    }

    if (isPlaying) {
      // Pause
      synth.cancel();
      setIsPlaying(false);
      stopProgressTimer();
      toast.success("Paused");
    } else {
      // Play current chapter
      playCurrentChapter();
    }
  };

  const playCurrentChapter = () => {
    if (!synth || !chapters[currentChapter]) {
      toast.error("No content to play");
      return;
    }

    const chapter = chapters[currentChapter];
    const chapterText =
      textChunks[currentChapter] ||
      chapter.text ||
      `Chapter ${currentChapter + 1}: ${
        chapter.title
      }. This is a demo chapter content. In production mode, this would contain the actual extracted text from your PDF document.`;

    // Stop any current speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(chapterText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = "en-US";

    // Find a good voice
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      startProgressTimer();
      toast.success(`Playing: ${chapter.title}`);
    };

    utterance.onend = () => {
      stopProgressTimer();

      // Auto-advance to next chapter
      if (currentChapter < chapters.length - 1) {
        setCurrentChapter(currentChapter + 1);
        setCurrentTime(chapters[currentChapter + 1].startSec);
        // Continue playing next chapter
        setTimeout(() => {
          if (isPlaying) {
            playCurrentChapter();
          }
        }, 500);
      } else {
        // End of podcast
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentChapter(0);
        toast.success("Podcast completed!");
      }
    };

    utterance.onerror = (event) => {
      setIsPlaying(false);
      stopProgressTimer();
      toast.error(`Speech synthesis error: ${event.error}`);
    };

    setCurrentUtterance(utterance);
    synth.speak(utterance);
  };

  const jumpToChapter = (chapterIndex: number) => {
    if (chapterIndex >= 0 && chapterIndex < chapters.length) {
      const wasPlaying = isPlaying;

      // Stop current playback
      if (synth) {
        synth.cancel();
      }
      setIsPlaying(false);
      stopProgressTimer();

      // Update position
      setCurrentChapter(chapterIndex);
      setCurrentTime(chapters[chapterIndex].startSec);

      toast.success(`Jumped to: ${chapters[chapterIndex].title}`);

      // Resume playing if it was playing before
      if (wasPlaying) {
        setTimeout(() => {
          playCurrentChapter();
        }, 300);
      }
    }
  };

  const skipBackward = () => {
    const newTime = Math.max(0, currentTime - 15);
    setCurrentTime(newTime);

    // Find appropriate chapter for new time
    const chapterIndex = chapters.findIndex((chapter, index) => {
      const nextChapter = chapters[index + 1];
      return (
        newTime >= chapter.startSec &&
        (!nextChapter || newTime < nextChapter.startSec)
      );
    });

    if (chapterIndex >= 0 && chapterIndex !== currentChapter) {
      setCurrentChapter(chapterIndex);
      if (isPlaying) {
        setTimeout(() => playCurrentChapter(), 100);
      }
    }

    toast.info("Skipped back 15 seconds");
  };

  const skipForward = () => {
    const newTime = Math.min(duration, currentTime + 15);
    setCurrentTime(newTime);

    // Find appropriate chapter for new time
    const chapterIndex = chapters.findIndex((chapter, index) => {
      const nextChapter = chapters[index + 1];
      return (
        newTime >= chapter.startSec &&
        (!nextChapter || newTime < nextChapter.startSec)
      );
    });

    if (chapterIndex >= 0 && chapterIndex !== currentChapter) {
      setCurrentChapter(chapterIndex);
      if (isPlaying) {
        setTimeout(() => playCurrentChapter(), 100);
      }
    }

    toast.info("Skipped forward 15 seconds");
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);

    // Find appropriate chapter
    const chapterIndex = chapters.findIndex((chapter, index) => {
      const nextChapter = chapters[index + 1];
      return (
        newTime >= chapter.startSec &&
        (!nextChapter || newTime < nextChapter.startSec)
      );
    });

    if (chapterIndex >= 0 && chapterIndex !== currentChapter) {
      setCurrentChapter(chapterIndex);
    }
  };

  const handleDownload = () => {
    toast.info(
      'Live TTS mode - use "Save as Audio" in your browser menu to record the speech',
      {
        duration: 4000,
      }
    );
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTimer();
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  if (!synth) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Mic className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Speech synthesis is not supported in this browser.</p>
            <p className="text-sm mt-2">
              Please try a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-green-500" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                🎙️ Live TTS
              </Badge>
              <span className="text-sm text-gray-600">
                {formatTime(duration)}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChapters(!showChapters)}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current chapter indicator */}
        {chapters.length > 0 &&
          currentChapter >= 0 &&
          chapters[currentChapter] && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Chapter {currentChapter + 1}: {chapters[currentChapter].title}
                </span>
              </div>
            </div>
          )}

        {/* Progress bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" onClick={skipBackward}>
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            onClick={togglePlayPause}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={skipForward}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-gray-600">Speed:</span>
            <Slider
              value={[speechRate]}
              min={0.5}
              max={2.0}
              step={0.1}
              onValueChange={(value) => setSpeechRate(value[0])}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-8">
              {speechRate.toFixed(1)}x
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Chapter list */}
        {showChapters && chapters.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Chapters</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {chapters.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => jumpToChapter(index)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    currentChapter === index
                      ? "bg-green-50 border-green-200"
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{chapter.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTime(chapter.startSec)} •{" "}
                        {formatTime(chapter.durationSec)}
                      </div>
                    </div>
                    {currentChapter === index && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        Now Playing
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live TTS Info */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-blue-600" />
            <span className="text-blue-800 font-medium">
              Live Text-to-Speech
            </span>
          </div>
          <div className="text-blue-700 text-sm mt-1">
            This podcast uses your browser's built-in text-to-speech engine for
            real-time audio generation.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
