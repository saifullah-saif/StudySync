"use client";

import React, { createContext, useContext, useState } from "react";

export interface PodcastItem {
  id: string | number;
  title: string;
  description?: string;
  duration?: number; // in seconds
  createdAt?: string;
  sourceType?: string;
  fullText?: string;
  episodeId?: string;
  coverGradient?: string;
}

interface PodcastContextShape {
  current: PodcastItem | null;
  isPlaying: boolean;
  isExpanded: boolean;
  play: (podcast: PodcastItem) => void;
  pause: () => void;
  toggleExpand: (expanded?: boolean) => void;
}

const PodcastContext = createContext<PodcastContextShape | undefined>(
  undefined
);

export const PodcastProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [current, setCurrent] = useState<PodcastItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const play = (podcast: PodcastItem) => {
    setCurrent(podcast);
    setIsPlaying(true);
    setIsExpanded(true); // Auto-expand when playing new podcast
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const toggleExpand = (expanded?: boolean) => {
    if (typeof expanded === "boolean") {
      setIsExpanded(expanded);
    } else {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <PodcastContext.Provider
      value={{
        current,
        isPlaying,
        isExpanded,
        play,
        pause,
        toggleExpand,
      }}
    >
      {children}
    </PodcastContext.Provider>
  );
};

export const usePodcast = () => {
  const context = useContext(PodcastContext);
  if (!context) {
    throw new Error("usePodcast must be used within PodcastProvider");
  }
  return context;
};

export default PodcastContext;
