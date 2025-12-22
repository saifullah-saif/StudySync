"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PodcastProvider, usePodcast } from "@/contexts/podcast-context";
import SimplePodcastPlayer from "@/components/SimplePodcastPlayer";
import { Play, Pause, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

function InnerNav() {
  const pathname = usePathname() || "";

  const navItems = [
    { name: "Dashboard", href: "/assistant" },
    { name: "Create Flashcards", href: "/assistant/flashcards" },
    { name: "My Files", href: "/assistant/files" },
    { name: "Podcasts", href: "/assistant/podcasts" },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/assistant"
                ? pathname === "/assistant"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-4 text-sm font-medium transition-colors",
                  isActive
                    ? "text-emerald-600"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {item.name}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function AssistantMiniPlayer() {
  const { current, isPlaying, play, pause, isExpanded, toggleExpand } =
    usePodcast();

  if (!current) return null;

  if (!isExpanded) {
    return (
      <div className="fixed left-1/2 bottom-6 transform -translate-x-1/2 w-[min(1100px,calc(100%-4rem))] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4 z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className={cn(
                "w-12 h-12 rounded-lg flex-shrink-0 bg-gradient-to-br",
                current.coverGradient || "from-slate-300 to-slate-400"
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {current.title}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {current.description || "Playing podcast"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={() => (isPlaying ? pause() : play(current))}
              className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" fill="currentColor" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
              )}
            </button>
            <button
              onClick={() => toggleExpand(true)}
              className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
            >
              Expand
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-1/2 bottom-6 transform -translate-x-1/2 w-[min(1100px,calc(100%-4rem))] z-50">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex-shrink-0 bg-gradient-to-br",
                current.coverGradient || "from-slate-300 to-slate-400"
              )}
            />
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {current.title}
              </div>
              <div className="text-xs text-slate-500">
                {current.description || "Playing podcast"}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleExpand(false)}
            className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1"
          >
            Minimize
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          <SimplePodcastPlayer
            fullText={current.fullText || ""}
            title={current.title}
            episodeId={current.episodeId}
            estimatedDuration={current.duration || 0}
          />
        </div>
      </div>
    </div>
  );
}

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PodcastProvider>
      <div className="min-h-screen bg-slate-50">
        <InnerNav />
        <main className="pb-32">{children}</main>
        <AssistantMiniPlayer />
      </div>
    </PodcastProvider>
  );
}
