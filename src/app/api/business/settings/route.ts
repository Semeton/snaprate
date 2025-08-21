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
        { error: "Only business owners can access settings" },
        { status: 403 },
      );
    }

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

    const settings = await BusinessService.getBusinessSettings(business.id);

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
    const business = await BusinessService.getBusinessByOwnerId(
      session.user.id,
    );
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const updatedSettings = await BusinessService.updateBusinessSettings(
      business.id,
      body,
    );

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
