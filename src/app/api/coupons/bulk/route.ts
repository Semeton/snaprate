import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CouponStatus, CouponType, CouponUseType } from "@/types";

interface BulkOperationResult {
  id: string;
  type: "create" | "update" | "delete" | "assign";
  status: "pending" | "processing" | "completed" | "failed";
  couponId?: string;
  couponTitle?: string;
  error?: string;
}

interface BulkCreateData {
  count: number;
  titlePrefix: string;
  titleSuffix?: string;
  value: number;
  type: CouponType;
  useType: CouponUseType;
  validFrom: string;
  validUntil: string;
  maxUses?: number;
  minimumOrderAmount?: number;
  allowedDaysOfWeek?: number[];
  cannotCombineWithOtherCoupons?: boolean;
  requiresIdVerification?: boolean;
}

interface BulkUpdateData {
  couponIds: string[];
  field: string;
  value: unknown;
}

interface BulkAssignData {
  couponIds: string[];
  userIds: string[];
}

interface BulkDeleteData {
  couponIds: string[];
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get business for the user
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, isVerified: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    if (!business.isVerified) {
      return NextResponse.json(
        { error: "Business must be verified for bulk operations" },
        { status: 403 },
      );
    }

    const { operation, data } = await request.json();

    const results: BulkOperationResult[] = [];

    switch (operation) {
      case "create":
        await handleBulkCreate(data, business.id, results);
        break;
      case "update":
        await handleBulkUpdate(data, business.id, results);
        break;
      case "assign":
        await handleBulkAssign(data, business.id, results);
        break;
      case "delete":
        await handleBulkDelete(data, business.id, results);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      results,
      operation,
      totalProcessed: results.length,
      successful: results.filter((r) => r.status === "completed").length,
      failed: results.filter((r) => r.status === "failed").length,
    });
  } catch (error) {
    console.error("Failed to perform bulk operation:", error);
    return NextResponse.json(
      {
        error: "Failed to perform bulk operation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function handleBulkCreate(
  data: BulkCreateData,
  businessId: string,
  results: BulkOperationResult[],
) {
  const {
    count,
    titlePrefix,
    titleSuffix,
    value,
    type,
    useType,
    validFrom,
    validUntil,
    maxUses,
    minimumOrderAmount,
    allowedDaysOfWeek,
    cannotCombineWithOtherCoupons,
    requiresIdVerification,
  } = data;

  for (let i = 0; i < count; i++) {
    const operationId = `create_${i}`;
    const result: BulkOperationResult = {
      id: operationId,
      type: "create",
      status: "processing",
    };

    try {
      const couponData = {
        businessId,
        title: `${titlePrefix} ${i + 1}${
          titleSuffix ? ` ${titleSuffix}` : ""
        }`.trim(),
        description: `Bulk created coupon ${i + 1}`,
        type: type as CouponType,
        value: typeof value === "number" ? value : parseFloat(String(value)),
        useType: useType as CouponUseType,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        maxUses: maxUses
          ? typeof maxUses === "number"
            ? maxUses
            : parseInt(String(maxUses))
          : 100,
        minimumOrderAmount: minimumOrderAmount
          ? typeof minimumOrderAmount === "number"
            ? minimumOrderAmount
            : parseFloat(String(minimumOrderAmount))
          : 0,
        allowedDaysOfWeek,
        cannotCombineWithOtherCoupons: Boolean(cannotCombineWithOtherCoupons),
        requiresIdVerification: Boolean(requiresIdVerification),
        status: CouponStatus.ACTIVE,
      };

      const coupon = await prisma.coupon.create({
        data: couponData,
      });

      result.status = "completed";
      result.couponId = coupon.id;
      result.couponTitle = coupon.title;
    } catch (error) {
      result.status = "failed";
      result.error = error instanceof Error ? error.message : "Unknown error";
    }

    results.push(result);
  }
}

async function handleBulkUpdate(
  data: BulkUpdateData,
  businessId: string,
  results: BulkOperationResult[],
) {
  const { couponIds, field, value } = data;

  for (const couponId of couponIds) {
    const operationId = `update_${couponId}`;
    const result: BulkOperationResult = {
      id: operationId,
      type: "update",
      status: "processing",
      couponId,
    };

    try {
      // Verify coupon belongs to business
      const coupon = await prisma.coupon.findFirst({
        where: {
          id: couponId,
          businessId,
        },
      });

      if (!coupon) {
        throw new Error("Coupon not found or access denied");
      }

      // Update the specified field
      const updateData: Record<string, unknown> = {};
      updateData[field] = value;

      await prisma.coupon.update({
        where: { id: couponId },
        data: updateData,
      });

      result.status = "completed";
      result.couponTitle = coupon.title;
    } catch (error) {
      result.status = "failed";
      result.error = error instanceof Error ? error.message : "Unknown error";
    }

    results.push(result);
  }
}

async function handleBulkAssign(
  data: BulkAssignData,
  businessId: string,
  results: BulkOperationResult[],
) {
  const { couponIds, userIds } = data;

  for (const couponId of couponIds) {
    const operationId = `assign_${couponId}`;
    const result: BulkOperationResult = {
      id: operationId,
      type: "assign",
      status: "processing",
      couponId,
    };

    try {
      // Verify coupon belongs to business
      const coupon = await prisma.coupon.findFirst({
        where: {
          id: couponId,
          businessId,
        },
      });

      if (!coupon) {
        throw new Error("Coupon not found or access denied");
      }

      // Assign to all specified users
      for (const userId of userIds) {
        await prisma.couponAssignment.create({
          data: {
            couponId,
            userId,
            assignedBy: businessId,
            status: "ASSIGNED",
          },
        });
      }

      result.status = "completed";
      result.couponTitle = coupon.title;
    } catch (error) {
      result.status = "failed";
      result.error = error instanceof Error ? error.message : "Unknown error";
    }

    results.push(result);
  }
}

async function handleBulkDelete(
  data: BulkDeleteData,
  businessId: string,
  results: BulkOperationResult[],
) {
  const { couponIds, reason } = data;

  for (const couponId of couponIds) {
    const operationId = `delete_${couponId}`;
    const result: BulkOperationResult = {
      id: operationId,
      type: "delete",
      status: "processing",
      couponId,
    };

    try {
      // Verify coupon belongs to business
      const coupon = await prisma.coupon.findFirst({
        where: {
          id: couponId,
          businessId,
        },
      });

      if (!coupon) {
        throw new Error("Coupon not found or access denied");
      }

      // Soft delete by setting status to EXPIRED
      await prisma.coupon.update({
        where: { id: couponId },
        data: {
          status: CouponStatus.EXPIRED,
          // Add deletion reason to description
          description: `${coupon.description || ""}\n\nDeleted: ${
            reason || "Bulk deletion"
          }`.trim(),
        },
      });

      result.status = "completed";
      result.couponTitle = coupon.title;
    } catch (error) {
      result.status = "failed";
      result.error = error instanceof Error ? error.message : "Unknown error";
    }

    results.push(result);
  }
}
