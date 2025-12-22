"use client";

/**
 * Audio-Based Podcast Player
 * Uses ONLY native HTML5 audio element
 * NO Web Speech API, NO estimated durations, NO fake timers
 *
 * PRINCIPLES:
 * - If browser can seek it, it's a real audio file
 * - Duration comes from audio.duration (metadata)
 * - Seeking is native (audio.currentTime)
 * - No simulation, no estimation, no fakery
 */

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Download,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Headphones,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface AudioPodcastPlayerProps {
  audioUrl: string;
  title?: string;
  podcastId?: string;
  className?: string;
  showHeader?: boolean;
}

export default function AudioPodcastPlayer({
  audioUrl,
  title = "Podcast",
  podcastId,
  className = "",
  showHeader = true,
}: AudioPodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Initialize audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      console.log(`✅ Audio loaded - Duration: ${audio.duration.toFixed(2)}s`);
    };

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      toast.success("Podcast finished!");
    };

    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setIsLoading(false);
      toast.error("Failed to load audio");
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [isSeeking]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        console.error("Playback error:", error);
        toast.error("Failed to play audio");
      });
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekChange = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handleSeekEnd = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
    setIsSeeking(false);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    const newVolume = value[0];

    setVolume(newVolume);
    if (audio) {
      audio.volume = newVolume;
    }

    if (newVolume > 0) {
      setPreviousVolume(newVolume);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (volume > 0) {
      setPreviousVolume(volume);
      setVolume(0);
      audio.volume = 0;
    } else {
      const newVolume = previousVolume || 1;
      setVolume(newVolume);
      audio.volume = newVolume;
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changePlaybackRate = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlaybackRate(rate);
    audio.playbackRate = rate;
    toast.success(`Playback speed: ${rate}x`);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_")}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className={`w-full border-none shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      {showHeader && (
        <CardHeader className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white pb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">
                    {title}
                  </CardTitle>
                  <p className="text-white/80 text-sm mt-1">
                    {formatTime(duration)}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-6 pt-6">
        {/* Native Audio Element */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading audio...</span>
          </div>
        )}

        {/* Timeline Section */}
        <div className="space-y-2">
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
            disabled={isLoading}
          />
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-medium text-gray-900">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="default"
            onClick={() => skip(-15)}
            disabled={isLoading}
            className="hover:bg-purple-50 hover:border-purple-300"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            onClick={togglePlayPause}
            size="lg"
            disabled={isLoading}
            className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={() => skip(15)}
            disabled={isLoading}
            className="hover:bg-purple-50 hover:border-purple-300"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Secondary Controls - Vertically Stacked */}
        <div className="flex flex-col items-center gap-4 pt-2">
          {/* Volume Control */}
          <div className="flex items-center gap-3 w-full max-w-xs">
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
              className="flex-1"
            />
          </div>

          {/* Playback Speed - Centered */}
          <div className="flex gap-2 justify-center">
            {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <Button
                key={rate}
                variant={playbackRate === rate ? "default" : "outline"}
                size="sm"
                onClick={() => changePlaybackRate(rate)}
                className={
                  playbackRate === rate
                    ? "bg-purple-600"
                    : "hover:bg-purple-50"
                }
              >
                {rate}x
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
