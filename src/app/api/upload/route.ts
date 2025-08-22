import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const type = formData.get("type") as string; // "image" or "video"

    console.log("Upload request received:");
    console.log("Files count:", files.length);
    console.log("Type:", type);
    console.log(
      "File names:",
      files.map((f) => f.name),
    );

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 },
      );
    }

    if (!type || !["image", "video"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type" },
        { status: 400 },
      );
    }

    const uploadedFiles: string[] = [];

    for (const file of files) {
      try {
        // Validate file size (5MB for images, 50MB for videos)
        const maxSize = type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxSize) {
          return NextResponse.json(
            {
              success: false,
              error: `File size too large. Max size: ${
                type === "image" ? "5MB" : "50MB"
              }`,
            },
            { status: 400 },
          );
        }

        // Validate file type
        const allowedImageTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];

        if (type === "image" && !allowedImageTypes.includes(file.type)) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid image format. Allowed: JPEG, PNG, WebP",
            },
            { status: 400 },
          );
        }

        if (type === "video" && !allowedVideoTypes.includes(file.type)) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid video format. Allowed: MP4, WebM, OGG",
            },
            { status: 400 },
          );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split(".").pop();
        const filename = `${timestamp}_${randomString}.${extension}`;

        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), "public", "uploads", type);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Save file
        const filePath = join(uploadDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        console.log(`File uploaded successfully: ${filePath}`);

        // Return public URL
        const publicUrl = `/uploads/${type}/${filename}`;
        uploadedFiles.push(publicUrl);

        console.log(`File uploaded successfully: ${filePath}`);
        console.log(`Public URL: ${publicUrl}`);
        console.log(`File size: ${file.size} bytes`);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        return NextResponse.json(
          { success: false, error: `Failed to upload ${file.name}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Files uploaded successfully",
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length,
      },
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload files" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: "File URL is required" },
        { status: 400 },
      );
    }

    // Extract file path from URL
    const filePath = join(process.cwd(), "public", fileUrl.replace(/^\//, ""));

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 },
      );
    }

    // Delete file
    await unlink(filePath);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
