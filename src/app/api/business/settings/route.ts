import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can access settings" },
        { status: 403 },
      );
    }

    // Get the user's business
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Get business settings (create default if doesn't exist)
    let settings = await prisma.businessSettings.findUnique({
      where: { businessId: business.id },
    });

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
          businessId: business.id,
          notifications: true,
          privacy: "PUBLIC",
          security: "STANDARD",
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    logger.error("Failed to get settings", { error });
    return NextResponse.json(
      {
        error: "Failed to get settings",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can update settings" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Get the user's business
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Update business settings
    const updatedSettings = await prisma.businessSettings.upsert({
      where: { businessId: business.id },
      update: body,
      create: {
        businessId: business.id,
        ...body,
      },
    });

    logger.info(`Business settings updated: ${business.id}`, {
      businessId: business.id,
      ownerId: session.user.id,
      updatedFields: Object.keys(body),
    });

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
      message: "Settings updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update settings", { error });
    return NextResponse.json(
      {
        error: "Failed to update settings",
      },
      { status: 500 },
    );
  }
}
