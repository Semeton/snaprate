import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is admin or super admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!adminUser || !["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get pagination parameters for admin actions
    const { searchParams } = new URL(request.url);
    const adminActionsPage = parseInt(
      searchParams.get("adminActionsPage") || "1",
    );
    const adminActionsLimit = parseInt(
      searchParams.get("adminActionsLimit") || "10",
    );
    const adminActionsSkip = (adminActionsPage - 1) * adminActionsLimit;

    // Get platform overview statistics
    const [
      totalUsers,
      totalBusinesses,
      totalReviews,
      totalAgents,
      pendingBusinesses,
      pendingAgentApplications,
      pendingInvitations,
      platformSettings,
    ] = await Promise.all([
      // User counts by role
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
        where: { status: "ACTIVE" },
      }),

      // Business statistics
      prisma.business.aggregate({
        _count: { id: true },
        _avg: { averageRating: true },
      }),

      // Review statistics
      prisma.review.aggregate({
        _count: { id: true },
        _avg: { rating: true },
      }),

      // Agent count
      prisma.user.count({
        where: { role: "AGENT", status: "ACTIVE" },
      }),

      // Pending business verifications
      prisma.business.count({
        where: { verificationStatus: "PENDING" },
      }),

      // Pending agent applications
      prisma.agentApplication.count({
        where: { status: "PENDING" },
      }),

      // Pending admin invitations
      prisma.adminInvitation.count({
        where: { status: "PENDING" },
      }),

      // Platform settings
      prisma.platformSettings.findFirst({
        where: { id: "main" },
      }),
    ]);

    // Process user counts
    const userCounts = {
      reviewers: 0,
      businessOwners: 0,
      agents: 0,
      admins: 0,
      superAdmins: 0,
    };

    totalUsers.forEach((userGroup) => {
      switch (userGroup.role) {
        case "REVIEWER":
          userCounts.reviewers = userGroup._count.role;
          break;
        case "BUSINESS_OWNER":
          userCounts.businessOwners = userGroup._count.role;
          break;
        case "AGENT":
          userCounts.agents = userGroup._count.role;
          break;
        case "ADMIN":
          userCounts.admins = userGroup._count.role;
          break;
        case "SUPER_ADMIN":
          userCounts.superAdmins = userGroup._count.role;
          break;
      }
    });

    // Calculate total users
    const totalUserCount = Object.values(userCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    // Get recent admin actions with pagination
    const [recentActions, totalAdminActions] = await Promise.all([
      prisma.adminAction.findMany({
        skip: adminActionsSkip,
        take: adminActionsLimit,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.adminAction.count(),
    ]);

    // Get recent pending items
    const recentPendingBusinesses = await prisma.business.findMany({
      where: { verificationStatus: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        city: true,
        state: true,
        createdAt: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const recentPendingAgents = await prisma.agentApplication.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUserCount,
          userBreakdown: userCounts,
          totalBusinesses: totalBusinesses._count.id || 0,
          totalReviews: totalReviews._count.id || 0,
          totalAgents,
          averageBusinessRating: totalBusinesses._avg.averageRating || 0,
          averageReviewRating: totalReviews._avg.rating || 0,
        },
        pending: {
          businesses: pendingBusinesses,
          agentApplications: pendingAgentApplications,
          adminInvitations: pendingInvitations,
        },
        recent: {
          adminActions: recentActions,
          adminActionsPagination: {
            page: adminActionsPage,
            limit: adminActionsLimit,
            total: totalAdminActions,
            totalPages: Math.ceil(totalAdminActions / adminActionsLimit),
          },
          pendingBusinesses: recentPendingBusinesses,
          pendingAgents: recentPendingAgents,
        },
        platformSettings: platformSettings || {
          minimumRedemptionAmount: 5000,
          reviewRewardAmount: 50,
          referralRewardAmount: 20,
          businessRecommendationRewardAmount: 100,
        },
        adminRole: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
