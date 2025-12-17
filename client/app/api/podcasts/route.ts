import { NextRequest, NextResponse } from "next/server";

// GET /api/podcasts - Retrieve all podcasts for the authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log("📻 GET /api/podcasts - Fetching user podcasts...");

    // Extract cookies from the incoming request to forward to backend
    const cookieHeader = request.headers.get("cookie");

    if (!cookieHeader) {
      console.warn("⚠️ No cookies found in request");
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("🔐 Forwarding authentication cookies to backend");

    // Make request to backend server with forwarded cookies
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";
    const response = await fetch(`${backendUrl}/api/podcasts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader, // Forward authentication cookies
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend error: ${response.status} - ${errorText}`);

      // If backend endpoint doesn't exist yet, return empty array
      if (response.status === 404) {
        console.warn(
          "⚠️ Backend endpoint not implemented yet, returning empty array"
        );
        return NextResponse.json({
          success: true,
          episodes: [],
          message: "Podcast feature in development",
        });
      }

      return NextResponse.json(
        { success: false, error: `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Retrieved ${data.episodes?.length || 0} podcasts`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error fetching podcasts:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch podcasts: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
