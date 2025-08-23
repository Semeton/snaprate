import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import {
  validateFileUpload,
  DEFAULT_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from "@/utils/uploadValidation";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const businessId = params.id;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user owns this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
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

    const formData = await request.formData();
    const file = formData.get("image") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    if (!type || !["logo", "coverImage"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid image type" },
        { status: 400 },
      );
    }

    // Validate file
    const validation = validateFileUpload(file, {
      maxSize: DEFAULT_IMAGE_SIZE,
      allowedTypes: ALLOWED_IMAGE_TYPES,
      type: "image",
    });

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    // Create uploads directory
    const uploadsDir = join(
      process.cwd(),
      "public",
      "uploads",
      "businesses",
      businessId,
    );
    await mkdir(uploadsDir, { recursive: true });

    // Generate filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const filename = `${type}_${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate URL
    const imageUrl = `/uploads/businesses/${businessId}/${filename}`;

    // Update business record
    await prisma.business.update({
      where: { id: businessId },
      data: {
        [type]: imageUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: { imageUrl },
      message: `${
        type === "logo" ? "Logo" : "Cover image"
      } uploaded successfully`,
    });
  } catch (error) {
    console.error("Failed to upload business image:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
