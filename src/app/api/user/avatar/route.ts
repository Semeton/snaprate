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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    // Validate file using utility
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const filename = `user_${session.user.id}_${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update user avatar in database
    const avatarUrl = `/uploads/avatars/${filename}`;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({
      success: true,
      data: { avatarUrl },
      message: "Avatar updated successfully",
    });
  } catch (error) {
    console.error("Failed to update avatar:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
