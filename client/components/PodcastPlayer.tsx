"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Clock,
  List,
  Gauge,
  Radio,
  Headphones,
  FastForward,
  Rewind,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [previousVolume, setPreviousVolume] = useState(1);
  const [currentChapter, setCurrentChapter] = useState<number>(-1);
  const [showChapters, setShowChapters] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [timeInput, setTimeInput] = useState("");
  const [showTimeInput, setShowTimeInput] = useState(false);

  // FIX: Update audio playback when playing state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || demoMode) return;

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error("Playback error:", error);
        setIsPlaying(false);
        toast.error("Failed to play audio");
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, demoMode]);

  // Update current time and chapter
  useEffect(() => {
    if (demoMode) {
      setDuration(
        chapters.reduce((sum, chapter) => sum + chapter.durationSec, 0) || 180
      );
      setCurrentChapter(0);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
      }

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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentChapter(-1);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [chapters, demoMode, isSeeking]);

  const togglePlayPause = () => {
    if (demoMode) {
      setIsPlaying(!isPlaying);
      toast.info(isPlaying ? "Demo: Paused" : "Demo: Playing", {
        duration: 1000,
      });
      return;
    }

    setIsPlaying(!isPlaying);
  };

  // FIX: Improved seek handling with proper state management
  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekChange = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handleSeekEnd = (value: number[]) => {
    setIsSeeking(false);

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
    const newVolume = value[0];
    setVolume(newVolume);

    if (!demoMode && audioRef.current) {
      audioRef.current.volume = newVolume;
    }

    if (newVolume > 0) {
      setPreviousVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
    } else {
      const newVolume = previousVolume || 1;
      setVolume(newVolume);
      if (audioRef.current) audioRef.current.volume = newVolume;
    }
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

  // FIX: Add various skip intervals
  const skip = (seconds: number) => {
    if (demoMode) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      setCurrentTime(newTime);
      toast.info(
        `Demo: Skipped ${seconds > 0 ? "forward" : "backward"} ${Math.abs(
          seconds
        )}s`,
        { duration: 1000 }
      );
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  // FIX: Add time input functionality for direct time jumping
  const handleTimeInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeMatch = timeInput.match(/^(\d+):(\d+)$/);

    if (timeMatch) {
      const minutes = parseInt(timeMatch[1]);
      const seconds = parseInt(timeMatch[2]);
      const totalSeconds = minutes * 60 + seconds;

      if (totalSeconds >= 0 && totalSeconds <= duration) {
        if (!demoMode && audioRef.current) {
          audioRef.current.currentTime = totalSeconds;
        }
        setCurrentTime(totalSeconds);
        setShowTimeInput(false);
        setTimeInput("");
        toast.success(`Jumped to ${formatTime(totalSeconds)}`);
      } else {
        toast.error("Invalid time - outside podcast duration");
      }
    } else {
      toast.error("Invalid format. Use MM:SS (e.g., 2:30)");
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);

    if (!demoMode && audioRef.current) {
      audioRef.current.playbackRate = rate;
    }

    toast.success(`Playback speed: ${rate}x`);
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

  // Calculate progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className={`w-full border-none shadow-xl overflow-hidden ${className}`}>
      {/* Version Marker - Remove after confirming */}
      <div className="absolute top-2 right-2 z-50 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
        V2.0 ✓
      </div>

      {/* Gradient Header */}
      <CardHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white pb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">
                  {title}
                </CardTitle>
                {chapters.length > 0 && (
                  <p className="text-white/80 text-sm mt-1">
                    {chapters.length} chapters • {formatTime(duration)}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {chapters.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowChapters(!showChapters)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <List className="h-4 w-4 mr-1" />
                Chapters
              </Button>
            )}
            {downloadUrl && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar in Header */}
        <div className="mt-4">
          <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 transition-all duration-300 relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/40 animate-pulse" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Demo mode indicator */}
        {demoMode && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 p-4 rounded-xl animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-blue-900 font-bold">🎧 Demo Mode</div>
                <div className="text-blue-700 text-sm mt-1">
                  This is a demo of the podcast player. In production mode, actual
                  audio would be generated and playable.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden audio element */}
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
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200 animate-in slide-in-from-left duration-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Now Playing
                </span>
                <p className="text-sm font-bold text-gray-900">
                  Chapter {currentChapter + 1}: {chapters[currentChapter].title}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Progress Slider */}
        <div className="space-y-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeekChange}
            onPointerDown={handleSeekStart}
            onPointerUp={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              const time = percent * duration;
              handleSeekEnd([time]);
            }}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between items-center text-sm">
            <button
              onClick={() => setShowTimeInput(!showTimeInput)}
              className="font-mono font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              {formatTime(currentTime)}
            </button>
            <span className="font-mono text-gray-600">{formatTime(duration)}</span>
          </div>

          {/* Time Input for Direct Jump */}
          {showTimeInput && (
            <form onSubmit={handleTimeInputSubmit} className="flex gap-2 animate-in slide-in-from-top duration-300">
              <Input
                type="text"
                placeholder="MM:SS (e.g., 2:30)"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="font-mono"
              />
              <Button type="submit" size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                Jump
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTimeInput(false);
                  setTimeInput("");
                }}
              >
                Cancel
              </Button>
            </form>
          )}
        </div>

        {/* Main Controls with Gradients */}
        <div className="flex items-center justify-center gap-3">
          {/* 10s Back */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => skip(-10)}
            className="hover:bg-blue-50 hover:border-blue-300 transition-all"
            title="10 seconds back"
          >
            <Rewind className="h-4 w-4" />
            <span className="ml-1 text-xs">10s</span>
          </Button>

          {/* 15s Back */}
          <Button
            variant="outline"
            size="default"
            onClick={() => skip(-15)}
            className="hover:bg-purple-50 hover:border-purple-300 transition-all"
            aria-label="Skip backward 15 seconds"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          {/* Play/Pause with Gradient */}
          <Button
            onClick={togglePlayPause}
            size="lg"
            className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>

          {/* 15s Forward */}
          <Button
            variant="outline"
            size="default"
            onClick={() => skip(15)}
            className="hover:bg-purple-50 hover:border-purple-300 transition-all"
            aria-label="Skip forward 15 seconds"
          >
            <SkipForward className="h-5 w-5" />
          </Button>

          {/* 30s Forward */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => skip(30)}
            className="hover:bg-orange-50 hover:border-orange-300 transition-all"
            title="30 seconds forward"
          >
            <span className="mr-1 text-xs">30s</span>
            <FastForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Secondary Controls Row */}
        <div className="flex items-center justify-between gap-4 pt-2">
          {/* Volume Control */}
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="hover:bg-gray-100"
            >
              {volume === 0 ? (
                <VolumeX className="h-5 w-5 text-gray-600" />
              ) : (
                <Volume2 className="h-5 w-5 text-gray-600" />
              )}
            </Button>
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="flex-1 max-w-[150px]"
            />
            <span className="text-sm text-gray-600 font-medium min-w-[3rem]">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Playback Speed Control */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-purple-50 hover:border-purple-300 transition-all"
              >
                <Gauge className="h-4 w-4 mr-2" />
                {playbackRate}x
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                <DropdownMenuItem
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={playbackRate === rate ? "bg-purple-50" : ""}
                >
                  <span className="font-mono">{rate}x</span>
                  {playbackRate === rate && (
                    <Badge className="ml-auto bg-purple-600">Active</Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Chapters list */}
        {showChapters && chapters.length > 0 && (
          <div className="border-t-2 pt-6 animate-in slide-in-from-bottom duration-500">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <List className="w-5 h-5 text-purple-600" />
              Chapters ({chapters.length})
            </h4>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {chapters.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => jumpToChapter(index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                    currentChapter === index
                      ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 shadow-md"
                      : "hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          currentChapter === index
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        <span className="font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {chapter.title}
                        </p>
                        <p className="text-xs text-gray-600 font-mono">
                          {formatTime(chapter.startSec)} •{" "}
                          {formatTime(chapter.durationSec)} duration
                        </p>
                      </div>
                    </div>
                    {currentChapter === index && (
                      <Badge className="ml-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse">
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
