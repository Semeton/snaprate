import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: businessId } = await params;

    // Check if user owns this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, logo: true, coverImage: true },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    if (business.ownerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    const { type } = await request.json();

    if (!type || !["logo", "coverImage"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid image type" },
        { status: 400 },
      );
    }

    // Get current image URL
    const currentImageUrl = business[type as keyof typeof business] as string;

    if (!currentImageUrl) {
      return NextResponse.json(
        { success: false, error: "No image to remove" },
        { status: 400 },
      );
    }

    // Remove file from filesystem
    try {
      const imagePath = join(process.cwd(), "public", currentImageUrl);
      await unlink(imagePath);
    } catch (fileError) {
      console.warn("File not found or already removed:", fileError);
      // Continue with database update even if file removal fails
    }

    // Update business record
    await prisma.business.update({
      where: { id: businessId },
      data: {
        [type]: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${
        type === "logo" ? "Logo" : "Cover image"
      } removed successfully`,
    });
  } catch (error) {
    console.error("Failed to remove business image:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
