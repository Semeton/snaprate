import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BusinessService } from "@/services/BusinessService";
import logger from "@/lib/logger";

export async function PUT(request: NextRequest) {
  let body: any;
  let session: any;

  try {
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can update businesses" },
        { status: 403 },
      );
    }

    body = await request.json();
    const {
      name,
      description,
      category,
      phone,
      email,
      website,
      address,
      city,
      state,
    } = body;

    // Validate required fields
    if (!name || !category || !phone || !email || !address || !city || !state) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, category, phone, email, address, city, state",
        },
        { status: 400 },
      );
    }

    // Log the received data for debugging
    logger.info("Received business update data", {
      receivedFields: Object.keys(body),
      category: category,
      state: state,
      userId: session?.user?.id,
    });

    // Get the user's business
    const existingBusiness = await BusinessService.getBusinessByOwnerId(
      session.user.id,
    );
    if (!existingBusiness) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Update business
    const updatedBusiness = await BusinessService.updateBusiness(
      existingBusiness.id,
      {
        name,
        description,
        category,
        phone,
        email,
        website,
        address,
        city,
        state,
      },
    );

    logger.info(`Business updated successfully: ${updatedBusiness.id}`, {
      businessId: updatedBusiness.id,
      ownerId: session.user.id,
      updatedFields: Object.keys(body),
    });

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
      message: "Business updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update business", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: body,
      userId: session?.user?.id,
    });
    return NextResponse.json(
      {
        error: "Failed to update business",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
