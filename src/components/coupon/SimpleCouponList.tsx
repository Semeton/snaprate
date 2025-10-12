"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  EyeOff,
  Users,
  Calendar,
  DollarSign,
  Percent,
  Copy,
  Download,
  Trash2,
  Edit,
} from "lucide-react";
import { Coupon, CouponStatus, CouponVisibility } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SimpleCouponListProps {
  coupons: Coupon[];
  onStatusUpdate: (couponId: string, status: CouponStatus) => void;
  onDelete: (couponId: string) => void;
  onAssign?: (couponId: string) => void;
  onEdit?: (couponId: string) => void;
  loading?: boolean;
  tabPrefix?: string;
}

export default function SimpleCouponList({
  coupons,
  onStatusUpdate,
  onDelete,
  onAssign,
  onEdit,
  loading = false,
  tabPrefix = "",
}: SimpleCouponListProps) {
  const getStatusColor = (status: CouponStatus) => {
    switch (status) {
      case CouponStatus.ACTIVE:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case CouponStatus.DRAFT:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case CouponStatus.PAUSED:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case CouponStatus.EXPIRED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case CouponStatus.USED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getVisibilityIcon = (visibility: CouponVisibility) => {
    return visibility === CouponVisibility.PUBLIC ? (
      <Eye className="h-4 w-4" />
    ) : (
      <EyeOff className="h-4 w-4" />
    );
  };

  const getVisibilityColor = (visibility: CouponVisibility) => {
    return visibility === CouponVisibility.PUBLIC
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadCouponPDF = async (couponId: string) => {
    try {
      const response = await fetch(`/api/coupons/${couponId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `coupon-${couponId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No coupons yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create your first coupon to start offering discounts to customers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {coupons.map((coupon) => (
        <Card
          key={`${tabPrefix}-${coupon.id}`}
          className="hover:shadow-md transition-shadow"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {coupon.title}
                  </h3>
                  <Badge className={getStatusColor(coupon.status)}>
                    {coupon.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getVisibilityColor(coupon.couponType)}
                  >
                    <div className="flex items-center gap-1">
                      {getVisibilityIcon(coupon.couponType)}
                      {coupon.couponType}
                    </div>
                  </Badge>
                </div>

                {coupon.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {coupon.description}
                  </p>
                )}

                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    {coupon.type === "PERCENTAGE" ? (
                      <Percent className="h-4 w-4" />
                    ) : (
                      <DollarSign className="h-4 w-4" />
                    )}
                    <span>
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}%`
                        : formatCurrency(coupon.value)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(coupon.validFrom)} -{" "}
                      {formatDate(coupon.validUntil)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {coupon.currentUses}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : ""} uses
                    </span>
                  </div>
                </div>

                {/* Coupon Codes */}
                <div className="mt-4 space-y-2">
                  {coupon.baseCode && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Base Code:</span>
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                        {coupon.baseCode}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(coupon.baseCode!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {coupon.userSpecificCode && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">User Code:</span>
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                        {coupon.userSpecificCode}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          copyToClipboard(coupon.userSpecificCode!)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Assigned User */}
                {coupon.assignedUser && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Assigned to: {coupon.assignedUser.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCouponPDF(coupon.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(coupon.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onAssign &&
                      coupon.couponType === CouponVisibility.PRIVATE && (
                        <DropdownMenuItem onClick={() => onAssign(coupon.id)}>
                          <Users className="h-4 w-4 mr-2" />
                          Assign User
                        </DropdownMenuItem>
                      )}
                    {coupon.status === CouponStatus.ACTIVE && (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(coupon.id, CouponStatus.PAUSED)
                        }
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        Pause
                      </DropdownMenuItem>
                    )}
                    {coupon.status === CouponStatus.PAUSED && (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(coupon.id, CouponStatus.ACTIVE)
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Activate
                      </DropdownMenuItem>
                    )}
                    {coupon.status === CouponStatus.DRAFT && (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(coupon.id, CouponStatus.ACTIVE)
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Activate
                      </DropdownMenuItem>
                    )}
                    {coupon.status === CouponStatus.ACTIVE && (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(coupon.id, CouponStatus.EXPIRED)
                        }
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Mark as Expired
                      </DropdownMenuItem>
                    )}
                    {(coupon.status === CouponStatus.PAUSED ||
                      coupon.status === CouponStatus.EXPIRED) && (
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusUpdate(coupon.id, CouponStatus.ACTIVE)
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Reactivate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(coupon.id)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
