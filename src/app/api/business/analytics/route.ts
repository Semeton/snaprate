import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BusinessService } from "@/services/BusinessService";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can access analytics" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days")
      ? parseInt(searchParams.get("days")!)
      : 30;

    // Get the user's business
    const business = await BusinessService.getBusinessByOwnerId(
      session.user.id,
    );
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const analytics = await BusinessService.getBusinessAnalytics(
      business.id,
      days,
    );

    return NextResponse.json({ analytics });
  } catch (error) {
    logger.error("Failed to get analytics", { error });
    return NextResponse.json(
      {
        error: "Failed to get analytics",
      },
      { status: 500 },
    );
  }
}
