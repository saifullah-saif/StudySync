"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  RotateCcw,
  SkipForward,
  Pause,
  Play,
  X,
  Zap
} from "lucide-react";

interface PracticeControlsProps {
  currentCard: number;
  totalCards: number;
  timeElapsed: number;
  onUndo?: () => void;
  onSkip?: () => void;
  onPause?: () => void;
  onQuit?: () => void;
  isPaused?: boolean;
  canUndo?: boolean;
  className?: string;
}

export default function PracticeControls({
  currentCard,
  totalCards,
  timeElapsed,
  onUndo,
  onSkip,
  onPause,
  onQuit,
  isPaused = false,
  canUndo = false,
  className = "",
}: PracticeControlsProps) {
  const progress = totalCards > 0 ? (currentCard / totalCards) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAverageTime = () => {
    if (currentCard === 0) return 0;
    return Math.round(timeElapsed / currentCard);
  };

  const getProgressColor = () => {
    if (progress < 33) return "from-blue-500 to-blue-600";
    if (progress < 66) return "from-purple-500 to-purple-600";
    return "from-green-500 to-green-600";
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm ${className}`}>
      <div className="max-w-4xl mx-auto px-6 py-4">
        {/* Progress Section */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 text-sm font-semibold">
                Card {currentCard} of {totalCards}
              </Badge>
              <span className="text-sm text-gray-600 font-medium">
                {Math.round(progress)}% Complete
              </span>
            </div>

            {/* Time Stats */}
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="flex items-center space-x-2 px-3 py-1.5 border-blue-200 bg-blue-50/50">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-mono font-semibold text-blue-900">{formatTime(timeElapsed)}</span>
              </Badge>

              {currentCard > 0 && (
                <Badge variant="outline" className="flex items-center space-x-1.5 px-3 py-1.5 border-purple-200 bg-purple-50/50">
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-xs font-medium text-purple-900">
                    {formatTime(getAverageTime())}/card
                  </span>
                </Badge>
              )}
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 ease-out relative`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-2">
          {/* Undo Button */}
          {onUndo && (
            <Button
              onClick={onUndo}
              variant="outline"
              size="default"
              disabled={!canUndo}
              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Undo
            </Button>
          )}

          {/* Skip Button */}
          {onSkip && (
            <Button
              onClick={onSkip}
              variant="outline"
              size="default"
              className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Skip
            </Button>
          )}

          {/* Pause/Resume Button */}
          {onPause && (
            <Button
              onClick={onPause}
              variant={isPaused ? "default" : "outline"}
              size="default"
              className={
                isPaused
                  ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md"
                  : "hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-700 transition-all"
              }
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
          )}

          {/* Quit Button */}
          {onQuit && (
            <Button
              onClick={onQuit}
              variant="outline"
              size="default"
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all"
            >
              <X className="w-4 h-4 mr-2" />
              Quit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
