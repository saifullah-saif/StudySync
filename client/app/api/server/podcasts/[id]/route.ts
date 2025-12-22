import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for individual podcast operations
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5001";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📡 Proxying GET podcast ${params.id} to backend...`);

    const response = await fetch(
      `${BACKEND_URL}/api/server/podcasts/${params.id}`
    );
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`📡 Proxying DELETE podcast ${params.id} to backend...`);

    const response = await fetch(
      `${BACKEND_URL}/api/server/podcasts/${params.id}`,
      {
        method: "DELETE",
      }
    );
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
