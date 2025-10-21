import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CouponAnalyticsService } from "@/services/CouponAnalyticsService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get business for the user
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, isVerified: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    if (!business.isVerified) {
      return NextResponse.json(
        { error: "Business must be verified to export data" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const csvData = await CouponAnalyticsService.exportAnalyticsToCSV(
      business.id,
      startDate,
      endDate,
    );

    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="coupon-analytics-${
          business.name
        }-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to export analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
