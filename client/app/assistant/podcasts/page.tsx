"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { podcastAPI, Podcast } from "@/lib/podcasts";
import AudioPodcastPlayer from "@/components/AudioPodcastPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  Loader2,
  Music,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

export default function PodcastsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    // Check for highlight parameter
    const highlight = searchParams.get("highlight");
    if (highlight) {
      setHighlightId(highlight);
    }
  }, [searchParams]);

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
        setPodcasts(result.podcasts);
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

  const handleRetry = async (podcastId: string) => {
    try {
      const result = await podcastAPI.retryPodcast(podcastId);
      if (result.success) {
        toast.success("Retrying podcast generation...");
        // Refresh the list
        fetchPodcasts();
      } else {
        toast.error(result.error || "Failed to retry");
      }
    } catch (err) {
      toast.error("Failed to retry podcast generation");
    }
  };

  const handleDelete = async (podcastId: string) => {
    try {
      const result = await podcastAPI.deletePodcast(podcastId);
      if (result.success) {
        toast.success("Podcast deleted successfully");
        // Remove from list
        setPodcasts(podcasts.filter((p) => p.id !== podcastId));
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("Failed to delete podcast");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Generating
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Podcasts</h1>
              <p className="text-gray-600">
                Listen to all your generated podcasts
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Loading your podcasts...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900">
                    Failed to load podcasts
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <Button
                    onClick={fetchPodcasts}
                    variant="outline"
                    className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && podcasts.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-20">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Headphones className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No podcasts yet
                </h3>
                <p className="text-gray-600 mb-4 max-w-md">
                  Upload a PDF and generate your first podcast to get started
                </p>
                <Button
                  onClick={() => router.push("/assistant/files")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Go to Files
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Podcasts List */}
        {!loading && !error && podcasts.length > 0 && (
          <div className="space-y-6">
            {podcasts.map((podcast) => {
              const isHighlighted = highlightId === podcast.id;

              return (
                <div
                  key={podcast.id}
                  id={podcast.id}
                  className={`transition-all duration-300 ${
                    isHighlighted
                      ? "ring-4 ring-purple-400 rounded-lg"
                      : ""
                  }`}
                >
                  {/* Podcast Status Card for pending/failed */}
                  {podcast.status !== "ready" && (
                    <Card className="mb-4">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">
                                {podcast.title}
                              </CardTitle>
                              {getStatusBadge(podcast.status)}
                            </div>
                            <p className="text-sm text-gray-600">
                              {podcast.status === "pending" &&
                                "Generating audio in background..."}
                              {podcast.status === "failed" &&
                                `Failed: ${podcast.error_message || "Unknown error"}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Created {formatDate(podcast.created_at)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {podcast.status === "failed" && (
                              <Button
                                onClick={() => handleRetry(podcast.id)}
                                variant="outline"
                                size="sm"
                                className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Retry
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDelete(podcast.id)}
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )}

                  {/* Audio Player for ready podcasts */}
                  {podcast.status === "ready" && podcast.audio_url && (
                    <div className="relative">
                      {isHighlighted && (
                        <div className="absolute -top-3 left-4 z-10">
                          <Badge className="bg-purple-600 text-white shadow-lg">
                            Playing Now
                          </Badge>
                        </div>
                      )}
                      <AudioPodcastPlayer
                        audioUrl={podcast.audio_url}
                        title={podcast.title}
                        podcastId={podcast.id}
                        className={isHighlighted ? "shadow-2xl" : ""}
                      />
                      <div className="flex items-center justify-between mt-2 px-2">
                        <p className="text-xs text-gray-500">
                          Created {formatDate(podcast.created_at)}
                        </p>
                        <Button
                          onClick={() => handleDelete(podcast.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && !error && podcasts.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Total podcasts: <span className="font-semibold">{podcasts.length}</span>
              </span>
              <span className="text-gray-600">
                Ready to play:{" "}
                <span className="font-semibold text-green-600">
                  {podcasts.filter((p) => p.status === "ready").length}
                </span>
              </span>
              <span className="text-gray-600">
                Generating:{" "}
                <span className="font-semibold text-yellow-600">
                  {podcasts.filter((p) => p.status === "pending").length}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
  );
}
