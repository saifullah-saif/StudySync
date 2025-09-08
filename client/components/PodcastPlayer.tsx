"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { langchainAPI } from "@/lib/api";
import {
  Play,
  Pause,
  Download,
  Volume2,
  SkipBack,
  SkipForward,
  Clock,
  List,
} from "lucide-react";
import { toast } from "sonner";

export interface Chapter {
  title: string;
  startSec: number;
  durationSec: number;
  chunkIndex: number;
}

interface PodcastPlayerProps {
  audioUrl: string;
  chapters?: Chapter[];
  title?: string;
  episodeId?: string;
  downloadUrl?: string;
  className?: string;
  demoMode?: boolean;
}

export default function PodcastPlayer({
  audioUrl,
  chapters = [],
  title = "Podcast",
  episodeId,
  downloadUrl,
  className = "",
  demoMode = false,
}: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentChapter, setCurrentChapter] = useState<number>(-1);
  const [showChapters, setShowChapters] = useState(false);

  // Update current time and chapter
  useEffect(() => {
    if (demoMode) {
      // Set demo values
      setDuration(
        chapters.reduce((sum, chapter) => sum + chapter.durationSec, 0) || 180
      ); // Use chapter durations or default 3 minutes
      setCurrentChapter(0);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);

      // Find current chapter
      if (chapters.length > 0) {
        const chapterIndex = chapters.findIndex((chapter, index) => {
          const nextChapter = chapters[index + 1];
          return (
            audio.currentTime >= chapter.startSec &&
            (!nextChapter || audio.currentTime < nextChapter.startSec)
          );
        });
        setCurrentChapter(chapterIndex);
      }
    };

    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentChapter(-1);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [chapters, demoMode]);

  const extractedText = async () => {
    try {
      const extractedText = await langchainAPI.extractTextFromDocument(document!);
      return  extractedText;
    } catch (error) {
      console.error("Error extracting text:", error);
    }
  }


  const togglePlayPause = () => {
    if (demoMode) {
      // Demo mode - simulate play/pause
      setIsPlaying(!isPlaying);
      toast.info(isPlaying ? "Demo: Paused" : "Demo: Playing", {
        duration: 1000,
      });
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Playback error:", error);
          toast.error("Failed to play audio");
        });
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (demoMode) {
      setCurrentTime(value[0]);
      toast.info(`Demo: Seeked to ${formatTime(value[0])}`, { duration: 1000 });
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const jumpToChapter = (chapterIndex: number) => {
    if (demoMode) {
      setCurrentChapter(chapterIndex);
      toast.info(`Demo: Jumped to Chapter ${chapterIndex + 1}`, {
        duration: 1000,
      });
      return;
    }

    if (
      chapterIndex >= 0 &&
      chapterIndex < chapters.length &&
      audioRef.current
    ) {
      const chapter = chapters[chapterIndex];
      audioRef.current.currentTime = chapter.startSec;
      setCurrentChapter(chapterIndex);
      toast.success(`Jumped to: ${chapter.title}`);
    }
  };

  const skipBackward = () => {
    if (demoMode) {
      toast.info("Demo: Skipped backward 15s", { duration: 1000 });
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, audio.currentTime - 15);
  };

  const skipForward = () => {
    if (demoMode) {
      toast.info("Demo: Skipped forward 15s", { duration: 1000 });
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(duration, audio.currentTime + 15);
  };

  const handleDownload = () => {
    if (demoMode) {
      toast.info("Demo mode - download would be available in production mode", {
        duration: 3000,
      });
      return;
    }

    if (downloadUrl) {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${title
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "_")}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {chapters.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {chapters.length} chapters • {formatTime(duration)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {chapters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChapters(!showChapters)}
              >
                <List className="h-4 w-4 mr-1" />
                Chapters
              </Button>
            )}
            {downloadUrl && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Demo mode indicator */}
        {demoMode && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mb-4">
            <div className="flex items-center gap-2">
              <div className="text-blue-600 font-medium">🎧 Demo Mode</div>
            </div>
            <div className="text-blue-700 text-sm mt-1">
              This is a demo of the podcast player. In production mode, actual
              audio would be generated and playable.
            </div>
          </div>
        )}

        {/* Hidden audio element - only if not in demo mode */}
        {!demoMode && (
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
            onLoadedData={() => {
              console.log("Audio loaded successfully");
            }}
            onError={(e) => {
              console.error("Audio loading error:", e);
              if (!demoMode) {
                toast.error("Failed to load audio");
              }
            }}
          />
        )}

        {/* Current chapter indicator */}
        {chapters.length > 0 && currentChapter >= 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
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
          <Button
            variant="outline"
            size="sm"
            onClick={skipBackward}
            aria-label="Skip backward 15 seconds"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            onClick={togglePlayPause}
            size="lg"
            className="h-12 w-12 rounded-full"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={skipForward}
            aria-label="Skip forward 15 seconds"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-gray-600" />
          <Slider
            value={[volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 min-w-[3rem]">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Chapters list */}
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
                      ? "bg-blue-50 border-blue-200"
                      : "hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {index + 1}. {chapter.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatTime(chapter.startSec)} •{" "}
                        {formatTime(chapter.durationSec)}
                      </p>
                    </div>
                    {currentChapter === index && (
                      <Badge variant="secondary" className="ml-2">
                        Playing
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
