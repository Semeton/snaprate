"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import BulkCouponOperations from "@/components/BulkCouponOperations";
import CouponAnalyticsComponent from "@/components/CouponAnalytics";
import CouponForm from "@/components/CouponForm";
import BulkCouponActions from "@/components/BulkCouponActions";
import { UserRole, CouponType, CouponStatus, CouponUseType, CouponVisibility } from "@/types";
import {
  Gift,
  Plus,
  Search,
  BarChart3,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Shield,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Coupon {
  id: string;
  title: string;
  description?: string;
  baseCode: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  validFrom: string;
  validUntil: string;
  totalIssued: number;
  totalRedeemed: number;
  maxUses?: number;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
  visibility: CouponVisibility;
  requiresIdVerification: boolean;
  assignedUser?: {
    id: string;
    name: string;
    userIdentifier: string;
  };
}

interface Business {
  id: string;
  name: string;
  description?: string;
  category: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  logo?: string;
  coverImage?: string;
  isVerified: boolean;
  verificationStatus: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function BusinessCouponsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
      <BusinessCouponsContent />
    </ProtectedRoute>
  );
}

function BusinessCouponsContent() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | CouponStatus>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form state for creating/editing coupons
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "PERCENTAGE" as CouponType,
    value: "",
    minimumOrderAmount: "",
    maximumDiscount: "",
    validFrom: "",
    validUntil: "",
    maxUses: "",
    useType: "SINGLE_USE" as CouponUseType,
    allowedDaysOfWeek: [] as number[],
    allowedTimeStart: "",
    allowedTimeEnd: "",
    cannotCombineWithOtherCoupons: true,
    requiresIdVerification: false,
    visibility: "PUBLIC" as CouponVisibility,
    maxUsesPerUser: "1",
  });

  useEffect(() => {
    fetchCoupons();
    fetchBusiness();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/business/coupons");

      if (!response.ok) {
        if (response.status === 404) {
          // No business found, redirect to registration
          window.location.href = "/business/register";
          return;
        }
        throw new Error("Failed to fetch coupons");
      }

      const data = await response.json();
      // Ensure data is properly structured as an array
      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setError("Failed to load coupons. Please try again.");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusiness = async () => {
    try {
      const response = await fetch("/api/business");
      if (!response.ok) {
        throw new Error("Failed to fetch business data");
      }
      const data = await response.json();
      setBusiness(data);
    } catch (error) {
      console.error("Error fetching business:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCoupons();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (couponId: string, status: CouponStatus) => {
    try {
      const response = await fetch(`/api/business/coupons/${couponId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update coupon status");
      }

      // Update local state
      setCoupons((prevCoupons) =>
        prevCoupons.map((coupon) =>
          coupon.id === couponId ? { ...coupon, status } : coupon
        )
      );

      setMessage({
        type: "success",
        text: `Coupon status updated to ${status}`,
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating coupon status:", error);
      setMessage({
        type: "error",
        text: "Failed to update coupon status",
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const response = await fetch(`/api/business/coupons/${couponId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete coupon");
      }

      // Update local state
      setCoupons((prevCoupons) =>
        prevCoupons.filter((coupon) => coupon.id !== couponId)
      );

      setMessage({
        type: "success",
        text: "Coupon deleted successfully",
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting coupon:", error);
      setMessage({
        type: "error",
        text: "Failed to delete coupon",
      });
    }
  };

  const handleCreateCoupon = async (formData: any) => {
    try {
      setCreating(true);
      setError(null);

      const response = await fetch("/api/business/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create coupon");
      }

      const newCoupon = await response.json();
      setCoupons((prev) => [...prev, newCoupon]);
      setShowCreateDialog(false);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "PERCENTAGE" as CouponType,
        value: "",
        minimumOrderAmount: "",
        maximumDiscount: "",
        validFrom: "",
        validUntil: "",
        maxUses: "",
        useType: "SINGLE_USE" as CouponUseType,
        allowedDaysOfWeek: [],
        allowedTimeStart: "",
        allowedTimeEnd: "",
        cannotCombineWithOtherCoupons: true,
        requiresIdVerification: false,
        visibility: "PUBLIC" as CouponVisibility,
        maxUsesPerUser: "1",
      });

      setMessage({
        type: "success",
        text: "Coupon created successfully",
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error creating coupon:", error);
      setError(`Failed to create coupon: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setCreating(false);
    }
  };

  const handleAssignToUsers = async (couponId: string, userIds: string[]) => {
    try {
      const response = await fetch("/api/business/coupons/bulk-assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ couponId, userIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign coupon");
      }

      const result = await response.json();
      
      setMessage({
        type: "success",
        text: `Coupon assigned to ${result.assignedCount} users`,
      });

      // Refresh coupons to get updated data
      fetchCoupons();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
      return result;
    } catch (error) {
      console.error("Error assigning coupon:", error);
      setMessage({
        type: "error",
        text: `Failed to assign coupon: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      throw error;
    }
  };

  const handleDownloadQRCode = async (couponId: string) => {
    try {
      const response = await fetch(`/api/business/coupons/${couponId}/qrcode`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to generate QR code");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coupon-${couponId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading QR code:", error);
      setMessage({
        type: "error",
        text: "Failed to download QR code",
      });
    }
  };

  // Filter coupons based on search term and status filter
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.baseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coupon.description &&
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || coupon.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
              </DialogHeader>
              <CouponForm
                onSubmit={handleCreateCoupon}
                onCancel={() => setShowCreateDialog(false)}
                isSubmitting={creating}
              />
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                  {error}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <Input
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            prefix={<Search className="h-4 w-4 text-gray-400" />}
          />
        </div>
        <div className="w-full md:w-1/2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as CouponStatus | "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="DEPLETED">Depleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {message && (
        <div
          className={`${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          } border px-4 py-3 rounded`}
        >
          {message.text}
        </div>
      )}

      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">
            <Gift className="h-4 w-4 mr-2" />
            Coupon List
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <div className="text-center py-10">Loading coupons...</div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No coupons found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first coupon
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCoupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{coupon.title}</CardTitle>
                      <Badge
                        variant={
                          coupon.status === "ACTIVE"
                            ? "success"
                            : coupon.status === "DRAFT"
                            ? "outline"
                            : coupon.status === "PAUSED"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {coupon.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      Code: {coupon.baseCode}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm">
                      {coupon.description || "No description provided"}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Value:</span>{" "}
                        {coupon.type === "FIXED_AMOUNT"
                          ? formatCurrency(coupon.value)
                          : `${coupon.value}%`}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>{" "}
                        {coupon.type === "FIXED_AMOUNT"
                          ? "Fixed Amount"
                          : "Percentage"}
                      </div>
                      <div>
                        <span className="font-medium">Valid From:</span>{" "}
                        {formatDate(coupon.validFrom)}
                      </div>
                      <div>
                        <span className="font-medium">Valid Until:</span>{" "}
                        {formatDate(coupon.validUntil)}
                      </div>
                      <div>
                        <span className="font-medium">Issued:</span>{" "}
                        {coupon.totalIssued}
                      </div>
                      <div>
                        <span className="font-medium">Redeemed:</span>{" "}
                        {coupon.totalRedeemed}
                      </div>
                      <div>
                        <span className="font-medium">Visibility:</span>{" "}
                        {coupon.visibility === "PUBLIC" ? "Public" : "Private"}
                      </div>
                      {coupon.requiresIdVerification && (
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-1 text-blue-500" />
                          <span>ID Verification Required</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Handle edit (not implemented in this simplified version)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex space-x-2">
                        {coupon.status === "DRAFT" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(coupon.id, "ACTIVE")
                            }
                          >
                            Activate
                          </Button>
                        )}
                        {coupon.status === "ACTIVE" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(coupon.id, "PAUSED")
                            }
                          >
                            Pause
                          </Button>
                        )}
                        {coupon.status === "PAUSED" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusUpdate(coupon.id, "ACTIVE")
                            }
                          >
                            Resume
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <BulkCouponActions
                        coupon={coupon}
                        onAssignToUsers={handleAssignToUsers}
                        onDownloadQRCode={handleDownloadQRCode}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          {business ? (
            <CouponAnalyticsComponent businessId={business.id} />
          ) : (
            <div className="text-center py-10">Loading business data...</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
