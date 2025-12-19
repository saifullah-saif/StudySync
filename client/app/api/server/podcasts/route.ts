import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route to forward podcast requests to Express backend
 * This is needed because Next.js intercepts /api/* routes
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("📡 Proxying podcast creation to backend...");

    const response = await fetch(`${BACKEND_URL}/api/server/podcasts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Proxy request failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    console.log("📡 Proxying podcast list to backend...");

    const url = new URL(`${BACKEND_URL}/api/server/podcasts`);
    if (userId) {
      url.searchParams.set("userId", userId);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Proxy request failed",
      },
      { status: 500 }
    );
  }
}
