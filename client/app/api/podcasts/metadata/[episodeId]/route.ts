import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { episodeId: string } }
) {
  try {
    const episodeId = params.episodeId;

    console.log(`� Metadata request for episode: ${episodeId}`);

    // For demo purposes, return placeholder metadata
    const demoMetadata = {
      episodeId,
      title: "Demo StudySync Podcast",
      createdAt: new Date().toISOString(),
      totalDurationSec: 180, // 3 minutes
      chunks: 3,
      chapters: [
        {
          index: 0,
          title: "Introduction",
          startTime: 0,
          duration: 60,
          text: "Welcome to StudySync podcast generation demo...",
        },
        {
          index: 1,
          title: "Main Content",
          startTime: 60,
          duration: 90,
          text: "The main content of your study material...",
        },
        {
          index: 2,
          title: "Conclusion",
          startTime: 150,
          duration: 30,
          text: "Summary and conclusion of the content...",
        },
      ],
      lang: "en",
      textLength: 1000,
    };

    return NextResponse.json({
      success: true,
      metadata: demoMetadata,
      demoMode: true,
      message:
        "Demo metadata. In production mode, this would contain actual podcast metadata.",
    });
  } catch (error) {
    console.error("❌ Metadata error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to get episode metadata" },
      { status: 500 }
    );
  }
}
