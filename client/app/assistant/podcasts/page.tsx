"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { podcastAPI, Podcast } from "@/lib/podcasts";
import AudioPodcastPlayer from "@/components/AudioPodcastPlayer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Music, Headphones } from "lucide-react";
import { toast } from "sonner";

export default function PodcastsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push(
        "/auth?redirect=" + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    fetchPodcasts();
  }, [user, router]);

  const fetchPodcasts = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await podcastAPI.getUserPodcasts(String(user.id));

      if (result.success && result.podcasts) {
        // Filter only ready podcasts for the table view
        setPodcasts(result.podcasts.filter((p) => p.status === "ready"));
      } else {
        setError(result.error || "Failed to load podcasts");
        toast.error("Failed to load podcasts");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error("Failed to load podcasts");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRowClick = (podcast: Podcast) => {
    setSelectedPodcast(podcast);
    setIsModalOpen(true);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen text-slate-200"
        style={{ background: '#0F172A' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header with subtle gradient */}
          <div
            className="mb-8 pb-6 rounded-t-2xl"
            style={{
              background: 'linear-gradient(to bottom, rgba(139,92,246,0.12), transparent)'
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                }}
              >
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-slate-100">Podcasts</h1>
                <p className="text-slate-400 mt-1">
                  {podcasts.length} {podcasts.length === 1 ? "episode" : "episodes"}
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded"
                  style={{ background: '#1E293B', opacity: 0.5 }}
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div
              className="rounded-lg p-6 text-center"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)'
              }}
            >
              <p className="text-red-400">{error}</p>
              <Button
                onClick={fetchPodcasts}
                variant="outline"
                className="mt-4 border-red-500 text-red-400 hover:bg-red-500/10"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && podcasts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: '#1E293B' }}
              >
                <Music className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-slate-100">
                No podcasts yet
              </h3>
              <p className="text-slate-400 mb-6 max-w-md">
                Generate your first podcast from a document to get started
              </p>
              <Button
                onClick={() => router.push("/assistant/files")}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                Go to Files
              </Button>
            </div>
          )}

          {/* Table View */}
          {!loading && !error && podcasts.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: '#111827',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
              }}
            >
              {/* Table Header */}
              <div
                className="grid grid-cols-12 gap-4 px-6 py-3 border-b text-sm font-medium uppercase tracking-wider sticky top-0 backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(255,255,255,0.06)',
                  background: 'rgba(17,24,39,0.8)',
                  color: '#9CA3AF'
                }}
              >
                <div className="col-span-1">#</div>
                <div className="col-span-7">Podcast Title</div>
                <div className="col-span-2">Date Added</div>
                <div className="col-span-2">Duration</div>
              </div>

              {/* Table Rows */}
              <div>
                {podcasts.map((podcast, index) => (
                  <div
                    key={podcast.id}
                    onClick={() => handleRowClick(podcast)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b transition-all cursor-pointer group"
                    style={{
                      borderColor: 'rgba(255,255,255,0.04)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139,92,246,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Index */}
                    <div className="col-span-1 flex items-center text-sm" style={{ color: '#9CA3AF' }}>
                      {index + 1}
                    </div>

                    {/* Title */}
                    <div className="col-span-7 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)'
                        }}
                      >
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-semibold truncate transition-colors group-hover:text-violet-400"
                          style={{ color: '#E5E7EB' }}
                        >
                          {podcast.title}
                        </div>
                        <div className="text-sm truncate" style={{ color: '#6B7280' }}>
                          Study podcast
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 flex items-center text-sm" style={{ color: '#9CA3AF' }}>
                      {formatDate(podcast.created_at)}
                    </div>

                    {/* Duration */}
                    <div className="col-span-2 flex items-center text-sm" style={{ color: '#9CA3AF' }}>
                      {formatDuration(podcast.duration)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Podcast Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          className="max-w-lg text-slate-100 p-0 overflow-hidden"
          style={{
            background: '#111827',
            borderColor: 'rgba(255,255,255,0.1)',
            maxHeight: '90vh'
          }}
        >
          {selectedPodcast && (
            <div className="flex flex-col" style={{ maxHeight: '90vh' }}>
              {/* Header - Compact */}
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold pr-8" style={{ color: '#E5E7EB' }}>
                    {selectedPodcast.title}
                  </DialogTitle>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    {formatDate(selectedPodcast.created_at)} • {formatDuration(selectedPodcast.duration)}
                  </p>
                </DialogHeader>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto px-6 py-6 space-y-4">
                {/* Artwork - Constrained */}
                <div className="flex justify-center">
                  <div
                    className="w-64 h-64 rounded-lg flex items-center justify-center shadow-xl"
                    style={{
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #8B5CF6 100%)'
                    }}
                  >
                    <Headphones className="w-24 h-24 text-white/80" />
                  </div>
                </div>

                {/* Audio Player - Simplified */}
                {selectedPodcast.audio_url && (
                  <div className="pt-2">
                    <AudioPodcastPlayer
                      audioUrl={selectedPodcast.audio_url}
                      title={selectedPodcast.title}
                      podcastId={selectedPodcast.id}
                      showHeader={false}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
