"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Pause,
  Clock,
  Search,
  Sparkles,
  FileText,
  TrendingUp,
  History,
  ChevronRight,
  Volume2,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SimplePodcastPlayer from "@/components/SimplePodcastPlayer";
import { usePodcast } from "@/contexts/podcast-context";

interface Podcast {
  id: string;
  title: string;
  description: string;
  duration: number;
  createdAt: string;
  sourceType: "note" | "document" | "ai-generated";
  coverGradient: string;
  fullText?: string;
  episodeId?: string;
}

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [miniPlayerExpanded, setMiniPlayerExpanded] = useState(false);
  const { play } = usePodcast();

  // Fetch real podcasts from backend API
  useEffect(() => {
    let mounted = true;

    const fetchPodcasts = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/podcasts", {
          method: "GET",
          credentials: "include", // Include cookies in request
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Handle 404 or other errors gracefully
        if (!res.ok) {
          console.warn(`Podcasts API error: ${res.status} ${res.statusText}`);
          if (res.status === 401) {
            console.error("Authentication failed - user not logged in");
          }
          if (mounted) setPodcasts([]);
          return;
        }

        const json = await res.json();

        if (!mounted) return;

        if (json?.success && Array.isArray(json.episodes)) {
          // Map to our local Podcast shape if needed
          const eps = json.episodes.map((e: any) => ({
            id: e.id || e.episodeId || e._id || String(Math.random()),
            title: e.title || e.name || "Untitled Podcast",
            description: e.description || e.source || "",
            duration: e.duration || e.estimatedDuration || 0,
            createdAt: e.createdAt || e.created_at || new Date().toISOString(),
            sourceType: e.sourceType || "ai-generated",
            coverGradient: e.coverGradient || "from-slate-400 to-slate-500",
            fullText: e.fullText || e.text || "",
            episodeId: e.episodeId || e.id || undefined,
          }));

          setPodcasts(eps);
        } else {
          // fallback to empty list
          setPodcasts([]);
        }
      } catch (err) {
        console.warn("Failed to fetch podcasts:", err);
        setPodcasts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPodcasts();

    return () => {
      mounted = false;
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const getSourceIcon = (type: Podcast["sourceType"]) => {
    switch (type) {
      case "ai-generated":
        return <Sparkles className="h-3.5 w-3.5" />;
      case "document":
        return <FileText className="h-3.5 w-3.5" />;
      case "note":
        return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getSourceLabel = (type: Podcast["sourceType"]) => {
    switch (type) {
      case "ai-generated":
        return "AI Generated";
      case "document":
        return "From Document";
      case "note":
        return "From Notes";
    }
  };

  const filteredPodcasts = podcasts.filter((podcast) =>
    podcast.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentPodcasts = filteredPodcasts.slice(0, 4);
  const aiGeneratedPodcasts = filteredPodcasts.filter(
    (p) => p.sourceType === "ai-generated"
  );
  const documentPodcasts = filteredPodcasts.filter(
    (p) => p.sourceType === "document" || p.sourceType === "note"
  );

  const PodcastCard = ({ podcast }: { podcast: Podcast }) => (
    <Card
      className={cn(
        "group relative overflow-hidden bg-gradient-to-br",
        "border-0 shadow-md hover:shadow-lg transition-all duration-300",
        "hover:scale-[1.02] cursor-pointer rounded-xl",
        "w-[200px] h-[260px]",
        podcast.coverGradient
      )}
      onClick={() => {
        setSelectedPodcast(podcast);
        setMiniPlayerExpanded(false);
      }}
    >
      <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-all" />

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            play({
              id: podcast.id,
              title: podcast.title,
              description: podcast.description,
              duration: podcast.duration,
              createdAt: podcast.createdAt,
              sourceType: podcast.sourceType,
              fullText: podcast.fullText,
              episodeId: podcast.episodeId,
              coverGradient: podcast.coverGradient,
            });
          }}
          className="h-16 w-16 rounded-full bg-white text-black hover:bg-white/90 hover:scale-110 transition-transform shadow-2xl"
        >
          <Play className="h-7 w-7 ml-0.5" fill="currentColor" />
        </Button>
      </div>

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col justify-end">
        <Badge
          variant="secondary"
          className="absolute top-4 right-4 bg-slate-900/60 text-white border-0 backdrop-blur-sm"
        >
          <Clock className="h-3 w-3 mr-1" />
          {formatDuration(podcast.duration)}
        </Badge>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
            >
              {getSourceIcon(podcast.sourceType)}
              <span className="ml-1 text-xs">
                {getSourceLabel(podcast.sourceType)}
              </span>
            </Badge>
          </div>

          <h3 className="text-white font-bold text-lg line-clamp-2 leading-tight">
            {podcast.title}
          </h3>

          <p className="text-white/80 text-sm line-clamp-2">
            {podcast.description}
          </p>
        </div>
      </div>
    </Card>
  );

  const PodcastRow = ({
    title,
    podcasts,
    icon: Icon,
  }: {
    title: string;
    podcasts: Podcast[];
    icon: any;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        {podcasts.length > 4 && (
          <Button
            variant="ghost"
            className="text-slate-600 hover:text-slate-900"
          >
            See all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {podcasts.length === 0 ? (
        <div className="flex items-center justify-center h-[260px] bg-slate-100 rounded-xl border border-slate-200">
          <div className="text-center space-y-3 p-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-200">
              <Icon className="h-7 w-7 text-slate-600" />
            </div>
            <p className="text-sm text-slate-600 font-medium">
              No podcasts yet
            </p>
            <p className="text-xs text-slate-500">
              Generate from your notes and documents
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {podcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      )}
    </div>
  );

  const SkeletonCard = () => (
    <div className="w-[200px] h-[260px]">
      <Skeleton className="w-full h-full rounded-xl bg-slate-200" />
    </div>
  );

  return (
    <div className="bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">Your Podcasts</h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              AI-generated podcasts created from your study materials
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search your podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 rounded-full text-base"
            />
          </div>
        </div>

        {/* Podcast Sections */}
        {loading ? (
          <div className="space-y-12">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64 bg-slate-200" />
              <div className="flex gap-6 overflow-x-auto">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <PodcastRow
              title="Recently Generated"
              podcasts={recentPodcasts}
              icon={History}
            />

            <PodcastRow
              title="AI-Generated Podcasts"
              podcasts={aiGeneratedPodcasts}
              icon={Sparkles}
            />

            <PodcastRow
              title="From Your Documents"
              podcasts={documentPodcasts}
              icon={FileText}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && podcasts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold text-slate-900">
                No podcasts yet
              </h3>
              <p className="text-slate-600 max-w-md">
                Generate a podcast from your files
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Full Player Modal */}
      {selectedPodcast && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="relative w-full max-w-5xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-slate-900 hover:bg-slate-100"
              onClick={() => setSelectedPodcast(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200 overflow-hidden">
              <div className="p-12 space-y-8">
                {/* Cover and Info */}
                <div className="flex gap-8 items-start">
                  <div
                    className={cn(
                      "w-64 h-64 rounded-2xl bg-gradient-to-br flex-shrink-0 shadow-2xl",
                      selectedPodcast.coverGradient
                    )}
                  />

                  <div className="flex-1 space-y-6">
                    <div className="space-y-3">
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      >
                        {getSourceIcon(selectedPodcast.sourceType)}
                        <span className="ml-1.5">
                          {getSourceLabel(selectedPodcast.sourceType)}
                        </span>
                      </Badge>

                      <h2 className="text-4xl font-bold text-slate-900">
                        {selectedPodcast.title}
                      </h2>

                      <p className="text-lg text-slate-600">
                        {selectedPodcast.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatDuration(selectedPodcast.duration)}
                      </div>
                      <div>
                        Created{" "}
                        {new Date(
                          selectedPodcast.createdAt
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player */}
                <SimplePodcastPlayer
                  fullText={
                    selectedPodcast.fullText ||
                    "Sample podcast text for demonstration purposes..."
                  }
                  title={selectedPodcast.title}
                  episodeId={selectedPodcast.episodeId}
                  estimatedDuration={selectedPodcast.duration}
                  className="mt-8"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
