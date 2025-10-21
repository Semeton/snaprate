import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Create test file
    const testDir = join(process.cwd(), "public", "uploads", "test");
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true });
    }

    const filename = `test_${Date.now()}.txt`;
    const filePath = join(testDir, filename);
    const content = `Test file created at ${new Date().toISOString()}`;

    await writeFile(filePath, content);

    return NextResponse.json({
      success: true,
      message: "Test file created successfully",
      filePath,
      filename,
    });
  } catch (error) {
    console.error("Test upload error:", error);
    return NextResponse.json(
      { error: "Failed to create test file" },
      { status: 500 },
    );
  }
}
