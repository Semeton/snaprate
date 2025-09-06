import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewStatus, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const filter = searchParams.get("filter") || "ALL";
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";
    const showDeleted = searchParams.get("showDeleted") === "true";

    // Type the filter properly
    type FilterType = "ALL" | "DELETED" | ReviewStatus;
    const typedFilter: FilterType = filter as FilterType;

    // Build where clause
    const where: Prisma.ReviewWhereInput = {};

    if (typedFilter !== "ALL") {
      if (typedFilter === "DELETED") {
        where.deletedAt = { not: null };
      } else {
        where.status = typedFilter as ReviewStatus;
        where.deletedAt = null; // Only show non-deleted reviews for other filters
      }
    } else if (!showDeleted) {
      where.deletedAt = null; // Only show non-deleted reviews by default
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: "insensitive" } },
        { business: { name: { contains: search, mode: "insensitive" } } },
        { reviewer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Build orderBy clause
    const orderBy: {
      rating?: "asc" | "desc";
      status?: "asc" | "desc";
      createdAt?: "asc" | "desc";
    } = {};
    if (sortField === "rating") {
      orderBy.rating = sortDirection as "asc" | "desc";
    } else if (sortField === "status") {
      orderBy.status = sortDirection as "asc" | "desc";
    } else if (sortField === "createdAt") {
      orderBy.createdAt = sortDirection as "asc" | "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    // Get total count for pagination
    const total = await prisma.review.count({ where });

    // Get reviews with pagination
    const reviews = await prisma.review.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: reviews,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
