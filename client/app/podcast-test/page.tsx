"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PodcastTestPage() {
  "use client";

  import { useState } from "react";
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";
  import { Input } from "@/components/ui/input";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";

  interface PodcastResult {
    success: boolean;
    error?: string;
    episodeId?: string;
    duration?: number;
    chapters?: any[];
    demoMode?: boolean;
    message?: string;
  }

  export default function PodcastTestPage() {
    const [text, setText] = useState(
      `Welcome to StudySync. This is a test podcast generation. We are testing the PDF to podcast pipeline. The system uses Google Text-to-Speech API to convert text into natural-sounding audio. This feature allows students to listen to their study materials while commuting or exercising. The audio is processed using FFmpeg to create a seamless listening experience with chapter navigation. Students can benefit from auditory learning, which complements visual and kinesthetic learning styles.`
    );
    const [title, setTitle] = useState("StudySync Demo Podcast");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PodcastResult | null>(null);

    const testAPI = async () => {
      setLoading(true);
      setResult(null);

      try {
        const response = await fetch("/api/podcasts/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, title }),
        });

        const data = await response.json();
        setResult(data);
      } catch (error) {
        setResult({
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>🎧 Podcast API Test</CardTitle>
            <CardDescription>
              Test the PDF → Podcast generation API pipeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Podcast Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter podcast title"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Text Content
              </label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to convert to podcast"
                className="min-h-32"
              />
              <div className="text-xs text-muted-foreground mt-1">
                {text.length} characters
              </div>
            </div>

            <Button
              onClick={testAPI}
              disabled={loading || !text.trim()}
              className="w-full"
            >
              {loading ? "🎙️ Generating..." : "🎧 Generate Podcast"}
            </Button>

            {result && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg">
                    API Response {result.success ? "✅" : "❌"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>

                  {result.success && (
                    <div className="mt-4 space-y-2">
                      <div>
                        <strong>Episode ID:</strong> {result.episodeId}
                      </div>
                      <div>
                        <strong>Duration:</strong> {result.duration} seconds
                      </div>
                      <div>
                        <strong>Chapters:</strong>{" "}
                        {result.chapters?.length || 0}
                      </div>
                      {result.demoMode && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                          <div className="text-yellow-800 font-medium">
                            Demo Mode
                          </div>
                          <div className="text-yellow-700 text-sm mt-1">
                            {result.message}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  const [title, setTitle] = useState("StudySync Demo Podcast");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testAPI = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/podcasts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, title }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🎧 Podcast API Test</CardTitle>
          <CardDescription>
            Test the PDF → Podcast generation API pipeline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Podcast Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter podcast title"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Text Content
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to podcast"
              className="min-h-32"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {text.length} characters
            </div>
          </div>

          <Button
            onClick={testAPI}
            disabled={loading || !text.trim()}
            className="w-full"
          >
            {loading ? "🎙️ Generating..." : "🎧 Generate Podcast"}
          </Button>

          {result && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  API Response {result.success ? "✅" : "❌"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>

                {result.success && (
                  <div className="mt-4 space-y-2">
                    <div>
                      <strong>Episode ID:</strong> {result.episodeId}
                    </div>
                    <div>
                      <strong>Duration:</strong> {result.duration} seconds
                    </div>
                    <div>
                      <strong>Chapters:</strong> {result.chapters?.length || 0}
                    </div>
                    {result.demoMode && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                        <div className="text-yellow-800 font-medium">
                          Demo Mode
                        </div>
                        <div className="text-yellow-700 text-sm mt-1">
                          {result.message}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
