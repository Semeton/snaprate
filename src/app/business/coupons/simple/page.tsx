"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  BarChart3,
  Gift,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import SimpleCouponForm, {
  CouponFormData,
} from "@/components/coupon/SimpleCouponForm";
import SimpleCouponList from "@/components/coupon/SimpleCouponList";
import SimpleCouponAnalytics from "@/components/coupon/SimpleCouponAnalytics";
import EditCouponModal, {
  EditCouponData,
} from "@/components/coupon/EditCouponModal";
import AssignUserModal from "@/components/coupon/AssignUserModal";
import { Coupon, CouponStatus, CouponVisibility, Business } from "@/types";

export default function SimpleBusinessCouponsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [activeTab, setActiveTab] = useState("coupons");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchCoupons(), fetchBusiness()]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (
      session?.user?.role !== "BUSINESS_OWNER" &&
      session?.user?.role !== "ADMIN"
    ) {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [session, status, router, fetchData]);

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/business/coupons");
      const data = await response.json();

      if (!response.ok) {
        console.log(data, response);
        throw new Error(data.error || "Failed to fetch coupons");
      }

      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch coupons",
      );
    }
  };

  const fetchBusiness = async () => {
    try {
      const response = await fetch("/api/business");
      if (response.ok) {
        const data = await response.json();
        setBusiness(data.business);
      }
    } catch (error) {
      console.error("Failed to fetch business:", error);
    }
  };

  const handleCreateCoupon = async (formData: CouponFormData) => {
    try {
      setCreating(true);
      setError(null);

      const response = await fetch("/api/business/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          value: parseFloat(formData.value),
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
          couponType: formData.couponType,
          requiresReview: formData.requiresReview,
          useType: formData.useType,
          maxUsesPerUser: formData.maxUsesPerUser
            ? parseInt(formData.maxUsesPerUser)
            : 1,
          // Set defaults for required fields
          allowedDaysOfWeek: [],
          cannotCombineWithOtherCoupons: true,
          requiresIdVerification: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create coupon");
      }

      const data = await response.json();
      setCoupons((prev) => [data.coupon, ...prev]);
      setShowCreateDialog(false);
      setMessage({
        type: "success",
        text: "Coupon created successfully!",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to create coupon:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create coupon",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (
    couponId: string,
    newStatus: CouponStatus,
  ) => {
    try {
      const response = await fetch(`/api/business/coupons/${couponId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update coupon status");
      }

      setCoupons((prev) =>
        prev.map((coupon) =>
          coupon.id === couponId ? { ...coupon, status: newStatus } : coupon,
        ),
      );

      setMessage({
        type: "success",
        text: "Coupon status updated successfully!",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update coupon status:", error);
      setMessage({
        type: "error",
        text: "Failed to update coupon status",
      });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this coupon? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/business/coupons/${couponId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete coupon");
      }

      setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
      setMessage({
        type: "success",
        text: "Coupon deleted successfully!",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      setMessage({
        type: "error",
        text: "Failed to delete coupon",
      });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleAssignCoupon = (couponId: string) => {
    const coupon = coupons.find((c) => c.id === couponId);
    if (coupon) {
      setSelectedCoupon(coupon);
      setShowAssignDialog(true);
    }
  };

  const handleAssignUser = async (couponId: string, userIds: string[]) => {
    try {
      setCreating(true);
      setError(null);

      // Assign to each user individually
      const assignmentPromises = userIds.map((userId) =>
        fetch("/api/coupons/assign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ couponId, userId }),
        }),
      );

      const responses = await Promise.all(assignmentPromises);

      // Check if all assignments were successful
      const failedAssignments = responses.filter((response) => !response.ok);

      if (failedAssignments.length > 0) {
        const errorData = await failedAssignments[0].json();
        throw new Error(errorData.error || "Some assignments failed");
      }

      // Refresh coupons to get updated assignment counts
      await fetchCoupons();

      setMessage({
        type: "success",
        text: `Coupon assigned to ${userIds.length} user${
          userIds.length !== 1 ? "s" : ""
        } successfully!`,
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to assign coupon:", error);
      setError(
        error instanceof Error ? error.message : "Failed to assign coupon",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEditCoupon = (couponId: string) => {
    const coupon = coupons.find((c) => c.id === couponId);
    if (coupon) {
      setSelectedCoupon(coupon);
      setShowEditDialog(true);
    }
  };

  const handleSaveCoupon = async (couponId: string, data: EditCouponData) => {
    try {
      setCreating(true);
      setError(null);

      const response = await fetch(`/api/business/coupons/${couponId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          type: data.type,
          value: parseFloat(data.value),
          validFrom: new Date(data.validFrom).toISOString(),
          validUntil: new Date(data.validUntil).toISOString(),
          maxUses: data.maxUses ? parseInt(data.maxUses) : undefined,
          status: data.status,
          couponType: data.couponType,
          requiresReview: data.requiresReview,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update coupon");
      }

      const responseData = await response.json();

      // Update the coupon in the local state
      setCoupons((prev) =>
        prev.map((coupon) =>
          coupon.id === couponId
            ? { ...coupon, ...responseData.coupon }
            : coupon,
        ),
      );

      setMessage({
        type: "success",
        text: "Coupon updated successfully!",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update coupon:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update coupon",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = async () => {
    await fetchData();
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Coupon Management
            </h1>
            <hr className="my-4" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Unauthorized Access
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">{error}</p>
          <div>
            <Button variant="outline" asChild>
              <Link href="/business/verification">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Verify Business
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const publicCoupons = coupons.filter(
    (coupon) => coupon.couponType === CouponVisibility.PUBLIC,
  );
  const privateCoupons = coupons.filter(
    (coupon) => coupon.couponType === CouponVisibility.PRIVATE,
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Coupon Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your business coupons
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
                <DialogDescription>
                  Create a public coupon that anyone can claim, or a private
                  coupon for specific users.
                </DialogDescription>
              </DialogHeader>
              <SimpleCouponForm
                onSubmit={handleCreateCoupon}
                loading={creating}
                businessId={business?.id || ""}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Coupon Modal */}
          <EditCouponModal
            coupon={selectedCoupon}
            isOpen={showEditDialog}
            onClose={() => {
              setShowEditDialog(false);
              setSelectedCoupon(null);
            }}
            onSave={handleSaveCoupon}
            loading={creating}
          />

          {/* Assign User Modal */}
          <AssignUserModal
            coupon={selectedCoupon}
            isOpen={showAssignDialog}
            onClose={() => {
              setShowAssignDialog(false);
              setSelectedCoupon(null);
            }}
            onAssign={handleAssignUser}
            loading={creating}
          />
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            All Coupons ({coupons.length})
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Public ({publicCoupons.length})
          </TabsTrigger>
          <TabsTrigger value="private" className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            Private ({privateCoupons.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-6">
          <SimpleCouponList
            coupons={coupons}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDeleteCoupon}
            onAssign={handleAssignCoupon}
            onEdit={handleEditCoupon}
            loading={loading}
            tabPrefix="all"
          />
        </TabsContent>

        <TabsContent value="public" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Public Coupons
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                These coupons are visible to all users and can be claimed by
                anyone.
              </p>
            </CardHeader>
          </Card>
          <SimpleCouponList
            coupons={publicCoupons}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDeleteCoupon}
            onAssign={handleAssignCoupon}
            onEdit={handleEditCoupon}
            loading={loading}
            tabPrefix="public"
          />
        </TabsContent>

        <TabsContent value="private" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeOff className="h-5 w-5" />
                Private Coupons
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                These coupons are only visible to assigned users and cannot be
                claimed publicly.
              </p>
            </CardHeader>
          </Card>
          <SimpleCouponList
            coupons={privateCoupons}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDeleteCoupon}
            onAssign={handleAssignCoupon}
            onEdit={handleEditCoupon}
            loading={loading}
            tabPrefix="private"
          />
        </TabsContent>
      </Tabs>

      {/* Analytics Section */}
      {business && (
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                Track the performance of your coupons
              </p>
            </CardHeader>
            <CardContent>
              <SimpleCouponAnalytics
                businessId={business.id}
                businessName={business.name}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
