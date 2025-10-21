import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is a business owner
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    });

    if (!user || user.role !== "BUSINESS_OWNER" || !user.business) {
      return NextResponse.json(
        {
          success: false,
          error: "Only business owners can submit verification documents",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      directorIdType,
      directorIdNumber,
      directorIdImage,
      cacDocumentType,
      cacDocumentImage,
      firsTaxClearance,
      addressEvidenceType,
      addressEvidenceImage,
    } = body;

    // Convert empty strings to null for optional enum fields
    const cleanCacDocumentType =
      cacDocumentType === "" ? null : cacDocumentType;
    const cleanAddressEvidenceType =
      addressEvidenceType === "" ? null : addressEvidenceType;

    // Validate required fields
    if (!directorIdType || !directorIdNumber || !directorIdImage) {
      return NextResponse.json(
        { success: false, error: "Director ID information is required" },
        { status: 400 },
      );
    }

    // Validate that at least one additional verification document is provided
    const hasBusinessDocuments = cleanCacDocumentType && cacDocumentImage;
    const hasAddressEvidence = cleanAddressEvidenceType && addressEvidenceImage;

    if (!hasBusinessDocuments && !hasAddressEvidence) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You must provide either business documents (CAC) or address verification evidence to complete your submission",
        },
        { status: 400 },
      );
    }

    // Log the cleaned data for debugging
    console.log("Cleaned verification data:", {
      directorIdType,
      directorIdNumber,
      directorIdImage,
      cacDocumentType: cleanCacDocumentType,
      cacDocumentImage,
      firsTaxClearance,
      addressEvidenceType: cleanAddressEvidenceType,
      addressEvidenceImage,
    });

    // Check if verification already exists
    const existingVerification = await prisma.businessVerification.findUnique({
      where: { businessId: user.business.id },
    });

    let verification;

    if (existingVerification) {
      // Update existing verification
      verification = await prisma.businessVerification.update({
        where: { businessId: user.business.id },
        data: {
          directorIdType,
          directorIdNumber,
          directorIdImage,
          cacDocumentType: cleanCacDocumentType,
          cacDocumentImage,
          firsTaxClearance,
          addressEvidenceType: cleanAddressEvidenceType,
          addressEvidenceImage,
          verificationStatus: "PENDING",
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new verification
      verification = await prisma.businessVerification.create({
        data: {
          businessId: user.business.id,
          directorIdType,
          directorIdNumber,
          directorIdImage,
          cacDocumentType: cleanCacDocumentType,
          cacDocumentImage,
          firsTaxClearance,
          addressEvidenceType: cleanAddressEvidenceType,
          addressEvidenceImage,
        },
      });
    }

    // Update business verification status
    await prisma.business.update({
      where: { id: user.business.id },
      data: {
        verificationStatus: "PENDING",
        addressVerificationStatus: cleanAddressEvidenceType
          ? "UNVERIFIED" // Will be updated to PENDING when admin reviews
          : "UNVERIFIED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Verification documents submitted successfully",
      data: verification,
    });
  } catch (error) {
    console.error("Error submitting verification documents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit verification documents" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is a business owner
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true },
    });

    if (!user || user.role !== "BUSINESS_OWNER" || !user.business) {
      return NextResponse.json(
        {
          success: false,
          error: "Only business owners can view verification status",
        },
        { status: 403 },
      );
    }

    // Get verification status
    const verification = await prisma.businessVerification.findUnique({
      where: { businessId: user.business.id },
    });

    return NextResponse.json({
      success: true,
      data: {
        verification,
        business: {
          id: user.business.id,
          verificationStatus: user.business.verificationStatus,
          addressVerificationStatus: user.business.addressVerificationStatus,
          reviewStatus: user.business.reviewStatus,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching verification status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch verification status" },
      { status: 500 },
    );
  }
}
