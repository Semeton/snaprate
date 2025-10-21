import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegistrationStatus, RegistrationType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {
      // Only show FULL_REGISTRATION types - RECOMMENDATION types go to business-recommendations
      registrationType: "FULL_REGISTRATION",
    };

    if (
      status &&
      Object.values(RegistrationStatus).includes(status as RegistrationStatus)
    ) {
      where.status = status;
    }

    const [registrations, total] = await Promise.all([
      prisma.businessRegistration.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              userIdentifier: true,
            },
          },
          business: {
            select: {
              id: true,
              name: true,
              isVerified: true,
              verificationSource: true,
            },
          },
        },
      }),
      prisma.businessRegistration.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching business registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch business registrations" },
      { status: 500 },
    );
  }
}
