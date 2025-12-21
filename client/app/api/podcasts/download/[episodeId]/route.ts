import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { episodeId: string } }
) {
  try {
    const episodeId = params.episodeId;

    console.log(`� Download request for episode: ${episodeId}`);

    // For demo purposes, return a placeholder response
    return NextResponse.json(
      {
        success: false,
        error:
          "Demo mode - audio files not generated. In production mode, this would stream the generated MP3 file.",
        episodeId,
        demoMode: true,
        message:
          "This endpoint would serve the generated audio file in production mode with actual TTS synthesis.",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("❌ Download error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to download episode" },
      { status: 500 }
    );
  }
}
