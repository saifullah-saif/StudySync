import { NextRequest, NextResponse } from "next/server";
import {
  chunkText,
  estimateReadingTime,
} from "../../../../lib/podcast/textChunker";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Simple podcast generation for demo purposes
export async function POST(request: NextRequest) {
  try {
    console.log("🎙️ POST /api/podcasts/generate - Starting...");

    const body = await request.json();
    const { fileId, text, title, lang } = body;

    // Validate input
    if (!text && !fileId) {
      return NextResponse.json(
        { success: false, error: "Either text or fileId must be provided" },
        { status: 400 }
      );
    }

    let podcastText = text;
    let podcastTitle = title || "StudySync Podcast";

    // If fileId is provided, we would fetch the extracted text from storage
    // For now, we'll use the provided text directly
    if (fileId && !text) {
      return NextResponse.json(
        { success: false, error: "File text extraction not implemented yet" },
        { status: 400 }
      );
    }

    if (!podcastText || podcastText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Text cannot be empty" },
        { status: 400 }
      );
    }

    // Validate text length
    if (podcastText.length > 50000) {
      return NextResponse.json(
        {
          success: false,
          error: "Text is too long for demo (max 50,000 characters)",
        },
        { status: 400 }
      );
    }

    console.log(
      `📝 Processing text for podcast (${podcastText.length} chars)...`
    );

    // Create episode ID from content hash
    const contentHash = crypto
      .createHash("md5")
      .update(podcastText)
      .digest("hex");
    const episodeId = `episode_${contentHash}`;

    // Estimate reading time (average 150 words per minute)
    const wordCount = podcastText.split(/\s+/).length;
    const estimatedDuration = Math.ceil((wordCount / 150) * 60); // seconds

    console.log(`📊 Podcast metadata: ${wordCount} words, ~${estimatedDuration}s duration`);

    // Return success response with full text (no chapters)
    return NextResponse.json({
      success: true,
      episodeId,
      audioUrl: `/api/podcasts/download/${episodeId}`,
      duration: estimatedDuration,
      title: podcastTitle,
      demoMode: true,
      fullText: podcastText, // Send full text instead of chunks
      wordCount,
      message:
        "Podcast generated. Using live TTS for audio playback.",
    });
  } catch (error) {
    console.error("❌ Podcast generation error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: `Podcast generation failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // For demo purposes, return empty episodes list
    return NextResponse.json({
      success: true,
      episodes: [],
      message: "Demo mode - no persisted episodes available",
    });
  } catch (error) {
    console.error("❌ Error listing episodes:", error);

    return NextResponse.json(
      { success: false, error: "Failed to list episodes" },
      { status: 500 }
    );
  }
}
