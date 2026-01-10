import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { contentType, contentId, reason, description } = body;

    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Content type, content ID, and reason are required",
        },
        { status: 400 },
      );
    }

    if (!["REVIEW", "BUSINESS", "USER"].includes(contentType)) {
      return NextResponse.json(
        { success: false, error: "Invalid content type" },
        { status: 400 },
      );
    }

    if (
      ![
        "INAPPROPRIATE_CONTENT",
        "SPAM",
        "HARASSMENT",
        "FALSE_INFORMATION",
        "COPYRIGHT_VIOLATION",
        "OTHER",
      ].includes(reason)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid reason" },
        { status: 400 },
      );
    }

    // Check if user has already reported this content
    const existingReport = await prisma.reportedContent.findFirst({
      where: {
        contentType,
        contentId,
        reporterId: session.user.id,
        status: {
          in: ["PENDING", "INVESTIGATED"],
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: "You have already reported this content" },
        { status: 400 },
      );
    }

    // Verify the content exists
    let contentExists = false;
    switch (contentType) {
      case "REVIEW":
        const review = await prisma.review.findUnique({
          where: { id: contentId },
        });
        contentExists = !!review;
        break;
      case "BUSINESS":
        const business = await prisma.business.findUnique({
          where: { id: contentId },
        });
        contentExists = !!business;
        break;
      case "USER":
        const user = await prisma.user.findUnique({
          where: { id: contentId },
        });
        contentExists = !!user;
        break;
    }

    if (!contentExists) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 },
      );
    }

    // Create the report
    const report = await prisma.reportedContent.create({
      data: {
        contentType,
        contentId,
        reporterId: session.user.id,
        reason,
        description: description || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Content reported successfully",
      data: {
        reportId: report.id,
        status: report.status,
      },
    });
  } catch (error) {
    console.error("Content report error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to report content" },
      { status: 500 },
    );
  }
}
