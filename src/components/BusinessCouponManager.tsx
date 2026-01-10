"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Gift,
  Users,
  AlertCircle,
  Download,
  Copy,
  QrCode,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CouponType, CouponUseType } from "@/types";
interface Coupon {
  id: string;
  title: string;
  description?: string;
  baseCode: string;
  userSpecificCode?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  maxUses?: number;
  currentUses: number;
  totalIssued: number;
  totalRedeemed: number;
  validFrom: string;
  validUntil: string;
  status: string;
  useType: CouponUseType;
  allowedDaysOfWeek: number[];
  allowedTimeStart?: string;
  allowedTimeEnd?: string;
  requiresIdVerification: boolean;
  assignedUser?: {
    id: string;
    name: string;
    userIdentifier: string;
  };
  createdAt: string;
}

export default function BusinessCouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "FIXED_AMOUNT" as CouponType,
    value: "",
    minimumOrderAmount: "",
    maximumDiscount: "",
    maxUses: "",
    validFrom: "",
    validUntil: "",
    useType: "SINGLE_USE" as CouponUseType,
    allowedDaysOfWeek: [] as number[],
    allowedTimeStart: "",
    allowedTimeEnd: "",
    cannotCombineWithOtherCoupons: true,
    requiresIdVerification: false,
    maxUsesPerUser: "1",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/coupons");
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async () => {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          minimumOrderAmount: formData.minimumOrderAmount
            ? parseFloat(formData.minimumOrderAmount)
            : undefined,
          maximumDiscount: formData.maximumDiscount
            ? parseFloat(formData.maximumDiscount)
            : undefined,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
          maxUsesPerUser: formData.maxUsesPerUser
            ? parseInt(formData.maxUsesPerUser)
            : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCoupons((prev) => [data.coupon, ...prev]);
        setShowCreateDialog(false);
        resetForm();
      } else {
        setError(data.error || "Failed to create coupon");
      }
    } catch (error) {
      setError("Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "FIXED_AMOUNT" as CouponType,
      value: "",
      minimumOrderAmount: "",
      maximumDiscount: "",
      maxUses: "",
      validFrom: "",
      validUntil: "",
      useType: "SINGLE_USE" as CouponUseType,
      allowedDaysOfWeek: [],
      allowedTimeStart: "",
      allowedTimeEnd: "",
      cannotCombineWithOtherCoupons: true,
      requiresIdVerification: false,
      maxUsesPerUser: "1",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "USED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "EXPIRED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTypeLabel = (type: CouponType) => {
    return type === "PERCENTAGE" ? "Percentage" : "Fixed Amount";
  };

  const getUseTypeLabel = (useType: CouponUseType) => {
    switch (useType) {
      case "SINGLE_USE":
        return "Single Use";
      case "MULTI_USE":
        return "Multiple Use";
      case "ONCE_PER_USER":
        return "Once Per User";
      default:
        return useType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Coupon Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage coupons for your customers
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Coupon Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., 20% Off All Items"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: value as CouponType,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the coupon offer..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value">Value *</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    placeholder={formData.type === "PERCENTAGE" ? "20" : "1000"}
                  />
                </div>
                <div>
                  <Label htmlFor="minimumOrderAmount">
                    Minimum Order Amount
                  </Label>
                  <Input
                    id="minimumOrderAmount"
                    type="number"
                    value={formData.minimumOrderAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minimumOrderAmount: e.target.value,
                      }))
                    }
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validFrom">Valid From *</Label>
                  <Input
                    id="validFrom"
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        validFrom: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until *</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        validUntil: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="useType">Use Type</Label>
                  <Select
                    value={formData.useType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        useType: value as CouponUseType,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE_USE">Single Use</SelectItem>
                      <SelectItem value="MULTI_USE">Multiple Use</SelectItem>
                      <SelectItem value="ONCE_PER_USER">
                        Once Per User
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxUses">Max Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxUses: e.target.value,
                      }))
                    }
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresIdVerification"
                  checked={formData.requiresIdVerification}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requiresIdVerification: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="requiresIdVerification">
                  Require ID verification for redemption
                </Label>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={createCoupon}
                  disabled={
                    creating ||
                    !formData.title ||
                    !formData.value ||
                    !formData.validFrom ||
                    !formData.validUntil
                  }
                  className="flex-1"
                >
                  {creating ? "Creating..." : "Create Coupon"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons List */}
      <div className="grid gap-4">
        {coupons.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No coupons yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first coupon to start attracting customers
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </CardContent>
          </Card>
        ) : (
          coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{coupon.title}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getTypeLabel(coupon.type)} •{" "}
                        {getUseTypeLabel(coupon.useType)}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(coupon.status)}>
                    {coupon.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Value
                    </Label>
                    <p className="text-lg font-semibold text-green-600">
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}%`
                        : formatCurrency(coupon.value)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Usage
                    </Label>
                    <p className="text-sm">
                      {coupon.currentUses} / {coupon.maxUses || "∞"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Assigned
                    </Label>
                    <p className="text-sm">{coupon.totalIssued} users</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Valid Period
                    </Label>
                    <p className="text-sm">
                      {formatDate(coupon.validFrom)} -{" "}
                      {formatDate(coupon.validUntil)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Base Code
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {coupon.baseCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(coupon.baseCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {coupon.assignedUser && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Assigned to
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {coupon.assignedUser.name}
                      </span>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {coupon.assignedUser.userIdentifier}
                      </code>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCouponPDF(coupon.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateQRCode(coupon.id)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </Button>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
