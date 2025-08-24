import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BusinessViewService from "@/services/BusinessViewService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: businessId } = await params;
    const session = await getServerSession(authOptions);

    // Get request details
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const referrer = request.headers.get("referer") || "unknown";

    // Determine source and view type from request
    const url = new URL(request.url);
    const source = url.searchParams.get("source") || "DIRECT";
    const viewType = url.searchParams.get("viewType") || "PROFILE";
    const sessionId = url.searchParams.get("sessionId") || undefined;

    // Validate business exists
    const businessViewService = new BusinessViewService();

    // Track the view
    await businessViewService.trackView({
      businessId,
      viewerId: session?.user?.id,
      ipAddress: ipAddress.toString(),
      userAgent,
      referrer,
      source,
      viewType,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      message: "Business view tracked successfully",
    });
  } catch (error) {
    console.error("Failed to track business view:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track business view" },
      { status: 500 },
    );
  }
}
