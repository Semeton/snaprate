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

    // Get all agent applications with user information
    const applications = await prisma.agentApplication.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
            state: true,
            referralCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enhance each application with business registration counts
    const enhancedApplications = await Promise.all(
      applications.map(async (application) => {
        const [registeredBusinessesCount, verifiedBusinessesCount] =
          await Promise.all([
            prisma.businessRegistration.count({
              where: {
                agentId: application.userId,
                registrationType: "FULL_REGISTRATION",
              },
            }),
            prisma.businessRegistration.count({
              where: {
                agentId: application.userId,
                registrationType: "FULL_REGISTRATION",
                status: "VERIFIED",
              },
            }),
          ]);

        return {
          ...application,
          registeredBusinessesCount,
          verifiedBusinessesCount,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: enhancedApplications,
    });
  } catch (error) {
    console.error("Admin agents error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch agent applications" },
      { status: 500 },
    );
  }
}
