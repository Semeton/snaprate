"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { UserRole, CouponType, CouponStatus, CouponUseType } from "@/types";
import {
  Gift,
  Plus,
  Search,
  Users,
  BarChart3,
  Edit,
  Trash2,
  Copy,
  QrCode,
  Download,
  RefreshCw,
  Calendar,
  Shield,
  UserPlus,
  UserMinus,
  UserCheck,
  Settings,
} from "lucide-react";

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
  assignedUser?: {
    id: string;
    name: string;
    userIdentifier: string;
  };
}

interface Reviewer {
  id: string;
  name: string;
  email: string;
  userIdentifier: string;
  role: string;
  joinedDate: string;
  reviewsCount: number;
}

export default function BusinessCouponsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
      <BusinessCouponsContent />
    </ProtectedRoute>
  );
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

function BusinessCouponsContent() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | CouponStatus>(
    "all",
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // User assignment state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [reviewerSearch, setReviewerSearch] = useState("");

  // Form state for creating/editing coupons
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: CouponType;
    value: string;
    minimumOrderAmount: string;
    maximumDiscount: string;
    validFrom: string;
    validUntil: string;
    maxUses: string;
    useType: CouponUseType;
    allowedDaysOfWeek: number[];
    allowedTimeStart: string;
    allowedTimeEnd: string;
    cannotCombineWithOtherCoupons: boolean;
    requiresIdVerification: boolean;
    maxUsesPerUser: string;
  }>({
    title: "",
    description: "",
    type: CouponType.PERCENTAGE,
    value: "",
    minimumOrderAmount: "",
    maximumDiscount: "",
    validFrom: "",
    validUntil: "",
    maxUses: "",
    useType: CouponUseType.SINGLE_USE,
    allowedDaysOfWeek: [],
    allowedTimeStart: "",
    allowedTimeEnd: "",
    cannotCombineWithOtherCoupons: true,
    requiresIdVerification: false,
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
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch coupons",
      );
    } finally {
      setLoading(false);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCoupons(), fetchBusiness()]);
    setRefreshing(false);
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

      // Update the coupon in the local state
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

      // Remove the coupon from the local state
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

  const handleInputChange = (
    field: string,
    value: string | boolean | number[] | CouponType | CouponUseType,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (dayNumber: number) => {
    setFormData((prev) => ({
      ...prev,
      allowedDaysOfWeek: prev.allowedDaysOfWeek.includes(dayNumber)
        ? prev.allowedDaysOfWeek.filter((d) => d !== dayNumber)
        : [...prev.allowedDaysOfWeek, dayNumber],
    }));
  };

  const getDayName = (dayNumber: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayNumber];
  };

  // User assignment functions
  const fetchReviewers = async (search: string = "") => {
    try {
      setLoadingReviewers(true);
      const response = await fetch(
        `/api/reviewers?search=${encodeURIComponent(search)}&limit=20`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reviewers");
      }

      const data = await response.json();
      setReviewers(data.reviewers || []);
    } catch (error) {
      console.error("Failed to fetch reviewers:", error);
      setMessage({
        type: "error",
        text: "Failed to fetch reviewers",
      });
    } finally {
      setLoadingReviewers(false);
    }
  };

  const openAssignDialog = (couponId: string) => {
    setSelectedCouponId(couponId);
    setShowAssignDialog(true);
    setReviewerSearch("");
    fetchReviewers();
  };

  const assignCouponToUser = async (userId: string) => {
    if (!selectedCouponId) return;

    try {
      setAssigning(true);
      const response = await fetch("/api/coupons/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponId: selectedCouponId,
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign coupon");
      }

      const data = await response.json();
      console.log("Coupon assignment response:", data);

      // Update the coupon in the list
      setCoupons((prev) =>
        prev.map((coupon) =>
          coupon.id === selectedCouponId
            ? { ...coupon, assignedUser: data.coupon?.assignedUser }
            : coupon,
        ),
      );

      setShowAssignDialog(false);
      setSelectedCouponId(null);
      setMessage({
        type: "success",
        text: "Coupon assigned successfully!",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to assign coupon:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to assign coupon",
      });
    } finally {
      setAssigning(false);
    }
  };

  const unassignCoupon = async (couponId: string) => {
    try {
      const response = await fetch(`/api/coupons/assign?couponId=${couponId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to unassign coupon");
      }

      // Update the coupon in the list
      setCoupons((prev) =>
        prev.map((coupon) =>
          coupon.id === couponId
            ? { ...coupon, assignedUser: undefined }
            : coupon,
        ),
      );

      setMessage({
        type: "success",
        text: "Coupon unassigned successfully!",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to unassign coupon:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to unassign coupon",
      });
    }
  };

  const handleCreateCoupon = async () => {
    // Validate required fields
    if (
      !formData.title ||
      !formData.value ||
      !formData.validFrom ||
      !formData.validUntil
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate dates
    if (new Date(formData.validFrom) >= new Date(formData.validUntil)) {
      alert("Valid until date must be after valid from date");
      return;
    }

    try {
      setCreating(true);
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
          minimumOrderAmount: formData.minimumOrderAmount
            ? parseFloat(formData.minimumOrderAmount)
            : undefined,
          maximumDiscount: formData.maximumDiscount
            ? parseFloat(formData.maximumDiscount)
            : undefined,
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
          useType: formData.useType,
          allowedDaysOfWeek: formData.allowedDaysOfWeek,
          allowedTimeStart: formData.allowedTimeStart || undefined,
          allowedTimeEnd: formData.allowedTimeEnd || undefined,
          cannotCombineWithOtherCoupons: formData.cannotCombineWithOtherCoupons,
          requiresIdVerification: formData.requiresIdVerification,
          maxUsesPerUser: formData.maxUsesPerUser
            ? parseInt(formData.maxUsesPerUser)
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create coupon");
      }

      const data = await response.json();

      // Add the new coupon to the list
      setCoupons((prev) => [data.coupon, ...prev]);
      setShowCreateDialog(false);

      // Show success message
      setMessage({
        type: "success",
        text: "Coupon created successfully!",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        type: CouponType.PERCENTAGE,
        value: "",
        minimumOrderAmount: "",
        maximumDiscount: "",
        validFrom: "",
        validUntil: "",
        maxUses: "",
        useType: CouponUseType.SINGLE_USE,
        allowedDaysOfWeek: [],
        allowedTimeStart: "",
        allowedTimeEnd: "",
        cannotCombineWithOtherCoupons: true,
        requiresIdVerification: false,
        maxUsesPerUser: "1",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to create coupon:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to create coupon",
      });
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setCreating(false);
    }
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.baseCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || coupon.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: CouponStatus) => {
    switch (status) {
      case CouponStatus.ACTIVE:
        return "default";
      case CouponStatus.PAUSED:
        return "secondary";
      case CouponStatus.EXPIRED:
        return "destructive";
      case CouponStatus.DRAFT:
        return "outline";
      default:
        return "secondary";
    }
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.type === CouponType.PERCENTAGE) {
      return `${coupon.value}% off`;
    } else {
      return `₦${coupon.value.toLocaleString()} off`;
    }
  };

  const downloadCouponPDF = async (couponId: string) => {
    try {
      const response = await fetch(`/api/coupons/${couponId}/pdf`);

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
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
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const generateQRCode = async (couponId: string) => {
    try {
      const response = await fetch(`/api/coupons/${couponId}/qr`);

      if (!response.ok) {
        throw new Error("Failed to generate QR code");
      }

      const data = await response.json();

      // Open QR code in new window
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Coupon QR Code</title></head>
            <body style="margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif;">
              <h2>Coupon QR Code</h2>
              <img src="${data.qrCode}" alt="QR Code" style="max-width: 300px; margin: 20px 0;">
              <p><strong>Coupon Code:</strong> ${data.couponCode}</p>
              <p><strong>Verification URL:</strong> ${data.verificationURL}</p>
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Print QR Code</button>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to generate QR code. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading coupons...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Coupon Management
                  </h1>
                  {business && (
                    <Badge
                      variant={business.isVerified ? "default" : "secondary"}
                      className={`text-xs ${
                        business.isVerified
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {business.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {business?.isVerified
                    ? "Create and manage promotional offers"
                    : "Complete business verification to create coupons"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
              </Button>
              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
                <DialogTrigger asChild>
                  <Button disabled={!business?.isVerified}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Coupon
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Coupon</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Coupon Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          handleInputChange("title", e.target.value)
                        }
                        placeholder="e.g., 20% Off First Order"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        placeholder="Describe the coupon offer..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Discount Type *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) =>
                            handleInputChange("type", value)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={CouponType.PERCENTAGE}>
                              Percentage
                            </SelectItem>
                            <SelectItem value={CouponType.FIXED_AMOUNT}>
                              Fixed Amount
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="value">Discount Value *</Label>
                        <Input
                          id="value"
                          type="number"
                          value={formData.value}
                          onChange={(e) =>
                            handleInputChange("value", e.target.value)
                          }
                          placeholder={
                            formData.type === CouponType.PERCENTAGE
                              ? "20"
                              : "500"
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minimumOrderAmount">
                          Minimum Order Amount
                        </Label>
                        <Input
                          id="minimumOrderAmount"
                          type="number"
                          value={formData.minimumOrderAmount}
                          onChange={(e) =>
                            handleInputChange(
                              "minimumOrderAmount",
                              e.target.value,
                            )
                          }
                          placeholder="1000"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="maximumDiscount">
                          Maximum Discount
                        </Label>
                        <Input
                          id="maximumDiscount"
                          type="number"
                          value={formData.maximumDiscount}
                          onChange={(e) =>
                            handleInputChange("maximumDiscount", e.target.value)
                          }
                          placeholder="2000"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="validFrom">Valid From *</Label>
                        <Input
                          id="validFrom"
                          type="date"
                          value={formData.validFrom}
                          onChange={(e) =>
                            handleInputChange("validFrom", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="validUntil">Valid Until *</Label>
                        <Input
                          id="validUntil"
                          type="date"
                          value={formData.validUntil}
                          onChange={(e) =>
                            handleInputChange("validUntil", e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Use Type */}
                    <div>
                      <Label htmlFor="useType">Use Type *</Label>
                      <Select
                        value={formData.useType}
                        onValueChange={(value) =>
                          handleInputChange("useType", value as CouponUseType)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CouponUseType.SINGLE_USE}>
                            Single Use
                          </SelectItem>
                          <SelectItem value={CouponUseType.MULTI_USE}>
                            Multiple Use
                          </SelectItem>
                          <SelectItem value={CouponUseType.ONCE_PER_USER}>
                            Once Per User
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Usage Restrictions */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-medium">
                          Usage Restrictions
                        </h3>
                      </div>

                      {/* Allowed Days of Week */}
                      <div>
                        <Label>Allowed Days of Week</Label>
                        <div className="mt-2 grid grid-cols-7 gap-2">
                          {[0, 1, 2, 3, 4, 5, 6].map((dayNumber) => (
                            <div
                              key={dayNumber}
                              className="flex flex-col items-center"
                            >
                              <Checkbox
                                id={`day-${dayNumber}`}
                                checked={formData.allowedDaysOfWeek.includes(
                                  dayNumber,
                                )}
                                onCheckedChange={() =>
                                  handleDayToggle(dayNumber)
                                }
                              />
                              <Label
                                htmlFor={`day-${dayNumber}`}
                                className="text-xs mt-1 text-center"
                              >
                                {getDayName(dayNumber).slice(0, 3)}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Leave empty to allow all days
                        </p>
                      </div>

                      {/* Time Restrictions */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="allowedTimeStart">
                            Valid From Time
                          </Label>
                          <Input
                            id="allowedTimeStart"
                            type="time"
                            value={formData.allowedTimeStart}
                            onChange={(e) =>
                              handleInputChange(
                                "allowedTimeStart",
                                e.target.value,
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="allowedTimeEnd">
                            Valid Until Time
                          </Label>
                          <Input
                            id="allowedTimeEnd"
                            type="time"
                            value={formData.allowedTimeEnd}
                            onChange={(e) =>
                              handleInputChange(
                                "allowedTimeEnd",
                                e.target.value,
                              )
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-medium">
                          Additional Settings
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="cannotCombineWithOtherCoupons"
                            checked={formData.cannotCombineWithOtherCoupons}
                            onCheckedChange={(checked) =>
                              handleInputChange(
                                "cannotCombineWithOtherCoupons",
                                checked as boolean,
                              )
                            }
                          />
                          <Label htmlFor="cannotCombineWithOtherCoupons">
                            Cannot be combined with other coupons
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="requiresIdVerification"
                            checked={formData.requiresIdVerification}
                            onCheckedChange={(checked) =>
                              handleInputChange(
                                "requiresIdVerification",
                                checked as boolean,
                              )
                            }
                          />
                          <Label htmlFor="requiresIdVerification">
                            Requires ID verification for redemption
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="maxUsesPerUser">
                          Maximum Uses Per User
                        </Label>
                        <Input
                          id="maxUsesPerUser"
                          type="number"
                          value={formData.maxUsesPerUser}
                          onChange={(e) =>
                            handleInputChange("maxUsesPerUser", e.target.value)
                          }
                          placeholder="1"
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Maximum times a single user can use this coupon
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="maxUses">Maximum Uses</Label>
                      <Input
                        id="maxUses"
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) =>
                          handleInputChange("maxUses", e.target.value)
                        }
                        placeholder="100"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                        disabled={creating}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCoupon} disabled={creating}>
                        {creating ? "Creating..." : "Create Coupon"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="coupons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Coupons
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Bulk Operations
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coupons" className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                <p className="font-medium">Error loading coupons:</p>
                <p>{error}</p>
              </div>
            )}

            {/* Business Verification Notice */}
            {business && !business.isVerified && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <div>
                    <p className="font-medium">
                      Business Verification Required
                    </p>
                    <p className="text-sm">
                      Your business needs to be verified before you can create
                      coupons. Please complete the verification process to start
                      creating promotional offers.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        (window.location.href = "/business/verification")
                      }
                    >
                      Complete Verification
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Success/Error Message */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
                    : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Filters and Search */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search coupons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={CouponStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={CouponStatus.PAUSED}>Paused</SelectItem>
                  <SelectItem value={CouponStatus.EXPIRED}>Expired</SelectItem>
                  <SelectItem value={CouponStatus.DRAFT}>Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Coupons
                  </CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{coupons.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {
                      coupons.filter((c) => c.status === CouponStatus.ACTIVE)
                        .length
                    }{" "}
                    active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Issued
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {coupons
                      .reduce((sum, c) => sum + c.totalIssued, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across all coupons
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Redeemed
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {coupons
                      .reduce((sum, c) => sum + c.totalRedeemed, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {coupons.reduce((sum, c) => sum + c.totalIssued, 0) > 0
                      ? (
                          (coupons.reduce(
                            (sum, c) => sum + c.totalRedeemed,
                            0,
                          ) /
                            coupons.reduce(
                              (sum, c) => sum + c.totalIssued,
                              0,
                            )) *
                          100
                        ).toFixed(1)
                      : "0.0"}
                    % redemption rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Revenue Impact
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₦
                    {coupons
                      .reduce((sum, c) => {
                        if (c.type === CouponType.PERCENTAGE) {
                          return sum + c.totalRedeemed * (c.value / 100) * 1000; // Assuming avg order value
                        } else {
                          return sum + c.totalRedeemed * c.value;
                        }
                      }, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total discount value
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Coupons List */}
            <div className="space-y-4">
              {filteredCoupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {coupon.title}
                          </h3>
                          <Badge variant={getStatusColor(coupon.status)}>
                            {coupon.status}
                          </Badge>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {coupon.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Code:
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                                {coupon.baseCode}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    coupon.baseCode || "",
                                  );
                                  // You could add a toast notification here
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Discount:
                            </span>
                            <p className="font-semibold text-green-600 mt-1">
                              {getDiscountDisplay(coupon)}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Usage:
                            </span>
                            <p className="mt-1">
                              {coupon.totalRedeemed}/{coupon.totalIssued}
                              {coupon.maxUses && ` / ${coupon.maxUses}`}
                            </p>
                          </div>

                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Valid Until:
                            </span>
                            <p className="mt-1">
                              {new Date(coupon.validUntil).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Assigned User Information */}
                        {coupon.assignedUser && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center space-x-2">
                              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Assigned to:
                              </span>
                              <span className="text-sm text-blue-700 dark:text-blue-300">
                                {coupon.assignedUser.name} (
                                {coupon.assignedUser.userIdentifier})
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCouponPDF(coupon.id)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateQRCode(coupon.id)}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          QR Code
                        </Button>

                        {/* Assignment Buttons */}
                        {coupon.assignedUser ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unassignCoupon(coupon.id)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Unassign
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignDialog(coupon.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign
                          </Button>
                        )}

                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Select
                          value={coupon.status}
                          onValueChange={(value) =>
                            handleStatusUpdate(coupon.id, value as CouponStatus)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={CouponStatus.ACTIVE}>
                              Active
                            </SelectItem>
                            <SelectItem value={CouponStatus.PAUSED}>
                              Paused
                            </SelectItem>
                            <SelectItem value={CouponStatus.EXPIRED}>
                              Expired
                            </SelectItem>
                            <SelectItem value={CouponStatus.DRAFT}>
                              Draft
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCoupons.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {searchTerm || statusFilter !== "all"
                        ? "No coupons found"
                        : "No coupons yet"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "Create your first coupon to attract customers and boost sales!"}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Coupon
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <BulkCouponOperations />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {business && (
              <CouponAnalyticsComponent
                businessId={business.id}
                businessName={business.name}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* User Assignment Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Coupon to Reviewer/Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reviewerSearch">
                  Search Reviewers & Agents
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="reviewerSearch"
                    placeholder="Search by name, email, or user ID..."
                    value={reviewerSearch}
                    onChange={(e) => {
                      setReviewerSearch(e.target.value);
                      fetchReviewers(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loadingReviewers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Loading reviewers and agents...
                    </p>
                  </div>
                ) : reviewers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {reviewerSearch
                        ? "No reviewers or agents found matching your search"
                        : "No reviewers or agents available"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reviewers.map((reviewer) => (
                      <div
                        key={reviewer.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {reviewer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {reviewer.name}
                                </p>
                                <Badge
                                  variant={
                                    reviewer.role === "AGENT"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {reviewer.role === "AGENT"
                                    ? "Agent"
                                    : "Reviewer"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {reviewer.email} • ID: {reviewer.userIdentifier}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {reviewer.reviewsCount} reviews for your
                                business
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => assignCouponToUser(reviewer.id)}
                          disabled={assigning}
                          size="sm"
                        >
                          {assigning ? "Assigning..." : "Assign"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignDialog(false)}
                  disabled={assigning}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
