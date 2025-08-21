import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BusinessService } from "@/services/BusinessService";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can create businesses" },
        { status: 403 },
      );
    }

    const body = await request.json();
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
      latitude,
      longitude,
      verificationDocuments,
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

    // Check if user already has a business
    const existingBusiness = await BusinessService.getBusinessByOwnerId(
      session.user.id,
    );
    if (existingBusiness) {
      return NextResponse.json(
        { error: "User already has a business" },
        { status: 400 },
      );
    }

    const business = await BusinessService.createBusiness(session.user.id, {
      name,
      description,
      category,
      phone,
      email,
      website,
      address,
      city,
      state,
      latitude,
      longitude,
      verificationDocuments,
    });

    logger.info(`Business created successfully: ${business.id}`, {
      businessId: business.id,
      ownerId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      business,
      message: "Business created successfully",
    });
  } catch (error) {
    logger.error("Failed to create business", { error });
    return NextResponse.json(
      {
        error: "Failed to create business",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can access business data" },
        { status: 403 },
      );
    }

    const business = await BusinessService.getBusinessByOwnerId(
      session.user.id,
    );

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ business });
  } catch (error) {
    logger.error("Failed to get business", { error });
    return NextResponse.json(
      {
        error: "Failed to get business",
      },
      { status: 500 },
    );
  }
}
