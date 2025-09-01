"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LiveTTSPlayer from "@/components/LiveTTSPlayer";

export default function LiveTTSTestPage() {
  const [showPlayer, setShowPlayer] = useState(false);

  const testChapters = [
    {
      title: "Introduction to StudySync",
      startSec: 0,
      durationSec: 30,
      chunkIndex: 0,
      text: "Welcome to StudySync, your comprehensive study companion. This platform revolutionizes how you learn by providing intelligent flashcard generation, spaced repetition algorithms, and now innovative podcast features.",
    },
    {
      title: "PDF to Podcast Feature",
      startSec: 30,
      durationSec: 45,
      chunkIndex: 1,
      text: "Our PDF to Podcast pipeline transforms your study materials into audio content. This allows you to learn while commuting, exercising, or doing other activities. The system intelligently chunks your content into digestible chapters.",
    },
    {
      title: "Benefits of Audio Learning",
      startSec: 75,
      durationSec: 35,
      chunkIndex: 2,
      text: "Audio learning complements visual and kinesthetic learning styles. Students can retain information better when they engage multiple senses. Our TTS technology provides natural-sounding narration of your study materials.",
    },
  ];

  const textChunks = testChapters.map((chapter) => chapter.text || "");

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🎙️ Live TTS Player Test</CardTitle>
        </CardHeader>
        <CardContent>
          {!showPlayer ? (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Test the live text-to-speech podcast player with sample content.
              </p>
              <Button
                onClick={() => setShowPlayer(true)}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                🎧 Start Live TTS Test
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <LiveTTSPlayer
                chapters={testChapters}
                title="StudySync Live TTS Demo"
                episodeId="test-episode"
                textChunks={textChunks}
              />

              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => setShowPlayer(false)}>
                  Close Player
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
