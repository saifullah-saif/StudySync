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
  X 
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

  return (
    <div className={`bg-white border-b border-gray-200 p-4 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Card {currentCard} of {totalCards}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats and Controls */}
        <div className="flex items-center justify-between">
          {/* Left: Stats */}
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeElapsed)}</span>
            </Badge>
            
            {currentCard > 0 && (
              <Badge variant="outline" className="text-xs">
                Avg: {formatTime(getAverageTime())}/card
              </Badge>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center space-x-2">
            {/* Undo Button */}
            {onUndo && (
              <Button
                onClick={onUndo}
                variant="outline"
                size="sm"
                disabled={!canUndo}
                className="text-xs"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Undo
              </Button>
            )}

            {/* Skip Button */}
            {onSkip && (
              <Button
                onClick={onSkip}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <SkipForward className="w-4 h-4 mr-1" />
                Skip
              </Button>
            )}

            {/* Pause/Resume Button */}
            {onPause && (
              <Button
                onClick={onPause}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
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
                size="sm"
                className="text-xs text-red-600 border-red-300 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Quit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
