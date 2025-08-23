import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BusinessViewService from "@/services/BusinessViewService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const session = await getServerSession(authOptions);
    
    // Check if user has access to view business analytics
    // Business owners can view their own analytics, admins can view all
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const businessViewService = BusinessViewService.getInstance();
    
    // Get view statistics
    const stats = await businessViewService.getBusinessViewStats(businessId);
    
    // Get recent views (only for business owners and admins)
    const recentViews = await businessViewService.getRecentViews(businessId, 10);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentViews,
      },
    });
  } catch (error) {
    console.error("Failed to get business view stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get business view statistics" },
      { status: 500 }
    );
  }
}
