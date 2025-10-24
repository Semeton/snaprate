import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QRCodeService } from "@/services/QRCodeService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;

    // Verify the business exists and belongs to the user
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Check if the user owns this business
    if (business.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to access this business" },
        { status: 403 },
      );
    }

    // Generate the business profile URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const businessUrl = `${baseUrl}/businesses/${business.id}`;

    // Generate QR code
    const qrCode = await QRCodeService.generateQRCodeDataURL(businessUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#2563eb", // Blue color
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      success: true,
      qrCode,
      businessUrl,
      businessName: business.name,
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 },
    );
  }
}
