"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  Download,
  Copy,
  Trash2,
  Plus,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Users,
  Calendar,
  DollarSign,
} from "lucide-react";
import { CouponType, CouponUseType } from "@/types";

interface CouponTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  useType: CouponUseType;
  allowedDaysOfWeek: number[];
  allowedTimeStart?: string;
  allowedTimeEnd?: string;
  cannotCombineWithOtherCoupons: boolean;
  requiresIdVerification: boolean;
  maxUsesPerUser?: number;
}

interface BulkCouponOperation {
  id: string;
  type: "create" | "update" | "delete" | "assign";
  status: "pending" | "processing" | "completed" | "failed";
  couponId?: string;
  couponTitle?: string;
  error?: string;
}

const BulkCouponOperations: React.FC = () => {
  const [operation, setOperation] = useState<
    "create" | "update" | "delete" | "assign"
  >("create");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkCouponOperation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bulk Create State
  const [bulkCreateData, setBulkCreateData] = useState({
    template: "",
    count: 1,
    titlePrefix: "",
    titleSuffix: "",
    value: 0,
    type: CouponType.PERCENTAGE,
    useType: CouponUseType.SINGLE_USE,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    maxUses: 100,
    minimumOrderAmount: 0,
    allowedDaysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
    cannotCombineWithOtherCoupons: true,
    requiresIdVerification: false,
  });

  // Bulk Update State
  const [bulkUpdateData, setBulkUpdateData] = useState({
    couponIds: "",
    field: "status",
    value: "ACTIVE",
    reason: "",
  });

  // Bulk Assign State
  const [bulkAssignData, setBulkAssignData] = useState({
    couponIds: "",
    userIds: "",
    reason: "",
  });

  // Templates
  const [templates, setTemplates] = useState<CouponTemplate[]>([
    {
      id: "1",
      name: "Weekend Special",
      title: "Weekend Special",
      description: "Special discount for weekend customers",
      type: CouponType.PERCENTAGE,
      value: 15,
      useType: CouponUseType.SINGLE_USE,
      allowedDaysOfWeek: [6, 0], // Saturday, Sunday
      cannotCombineWithOtherCoupons: true,
      requiresIdVerification: false,
    },
    {
      id: "2",
      name: "First Time Customer",
      title: "Welcome Discount",
      description: "Special discount for first-time customers",
      type: CouponType.PERCENTAGE,
      value: 20,
      minimumOrderAmount: 1000,
      useType: CouponUseType.ONCE_PER_USER,
      allowedDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      cannotCombineWithOtherCoupons: true,
      requiresIdVerification: true,
    },
    {
      id: "3",
      name: "Fixed Amount",
      title: "Fixed Discount",
      description: "Fixed amount discount",
      type: CouponType.FIXED_AMOUNT,
      value: 500,
      minimumOrderAmount: 2000,
      useType: CouponUseType.SINGLE_USE,
      allowedDaysOfWeek: [1, 2, 3, 4, 5, 6, 0],
      cannotCombineWithOtherCoupons: false,
      requiresIdVerification: false,
    },
  ]);

  const handleBulkCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setResults([]);

      const response = await fetch("/api/coupons/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "create",
          data: bulkCreateData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create bulk coupons");
      }

      const data = await response.json();
      setResults(data.results);
      setSuccess(
        `Successfully created ${
          data.results.filter(
            (r: BulkCouponOperation) => r.status === "completed",
          ).length
        } coupons`,
      );
    } catch (error) {
      console.error("Failed to create bulk coupons:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create bulk coupons",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setResults([]);

      const couponIds = bulkUpdateData.couponIds
        .split("\n")
        .filter((id) => id.trim());

      const response = await fetch("/api/coupons/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "update",
          data: {
            ...bulkUpdateData,
            couponIds,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bulk coupons");
      }

      const data = await response.json();
      setResults(data.results);
      setSuccess(
        `Successfully updated ${
          data.results.filter(
            (r: BulkCouponOperation) => r.status === "completed",
          ).length
        } coupons`,
      );
    } catch (error) {
      console.error("Failed to update bulk coupons:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update bulk coupons",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setResults([]);

      const couponIds = bulkAssignData.couponIds
        .split("\n")
        .filter((id) => id.trim());
      const userIds = bulkAssignData.userIds
        .split("\n")
        .filter((id) => id.trim());

      const response = await fetch("/api/coupons/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "assign",
          data: {
            ...bulkAssignData,
            couponIds,
            userIds,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign bulk coupons");
      }

      const data = await response.json();
      setResults(data.results);
      setSuccess(
        `Successfully assigned ${
          data.results.filter(
            (r: BulkCouponOperation) => r.status === "completed",
          ).length
        } coupons`,
      );
    } catch (error) {
      console.error("Failed to assign bulk coupons:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to assign bulk coupons",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setBulkCreateData({
        ...bulkCreateData,
        template: templateId,
        titlePrefix: template.title,
        value: template.value,
        type: template.type,
        useType: template.useType,
        minimumOrderAmount: template.minimumOrderAmount || 0,
        allowedDaysOfWeek: template.allowedDaysOfWeek,
        cannotCombineWithOtherCoupons: template.cannotCombineWithOtherCoupons,
        requiresIdVerification: template.requiresIdVerification,
      });
    }
  };

  const getStatusIcon = (status: BulkCouponOperation["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: BulkCouponOperation["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bulk Coupon Operations
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Efficiently manage multiple coupons at once
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">Beta Feature</Badge>
        </div>
      </div>

      {/* Operation Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Operation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant={operation === "create" ? "default" : "outline"}
              onClick={() => setOperation("create")}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Plus className="h-5 w-5 mb-2" />
              <span className="text-sm">Bulk Create</span>
            </Button>
            <Button
              variant={operation === "update" ? "default" : "outline"}
              onClick={() => setOperation("update")}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Save className="h-5 w-5 mb-2" />
              <span className="text-sm">Bulk Update</span>
            </Button>
            <Button
              variant={operation === "assign" ? "default" : "outline"}
              onClick={() => setOperation("assign")}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Users className="h-5 w-5 mb-2" />
              <span className="text-sm">Bulk Assign</span>
            </Button>
            <Button
              variant={operation === "delete" ? "default" : "outline"}
              onClick={() => setOperation("delete")}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Trash2 className="h-5 w-5 mb-2" />
              <span className="text-sm">Bulk Delete</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <Alert className="border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-600 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-600 dark:text-green-400">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk Create */}
      {operation === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Bulk Create Coupons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Template (Optional)</Label>
              <Select
                value={bulkCreateData.template}
                onValueChange={loadTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="count">Number of Coupons</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="100"
                  value={bulkCreateData.count}
                  onChange={(e) =>
                    setBulkCreateData({
                      ...bulkCreateData,
                      count: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titlePrefix">Title Prefix</Label>
                <Input
                  id="titlePrefix"
                  value={bulkCreateData.titlePrefix}
                  onChange={(e) =>
                    setBulkCreateData({
                      ...bulkCreateData,
                      titlePrefix: e.target.value,
                    })
                  }
                  placeholder="e.g., Summer Sale"
                />
              </div>
            </div>

            {/* Coupon Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Coupon Type</Label>
                <Select
                  value={bulkCreateData.type}
                  onValueChange={(value) =>
                    setBulkCreateData({
                      ...bulkCreateData,
                      type: value as CouponType,
                    })
                  }
                >
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  value={bulkCreateData.value}
                  onChange={(e) =>
                    setBulkCreateData({
                      ...bulkCreateData,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="useType">Use Type</Label>
                <Select
                  value={bulkCreateData.useType}
                  onValueChange={(value) =>
                    setBulkCreateData({
                      ...bulkCreateData,
                      useType: value as CouponUseType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CouponUseType.SINGLE_USE}>
                      Single Use
                    </SelectItem>
                    <SelectItem value={CouponUseType.MULTI_USE}>
                      Multi Use
                    </SelectItem>
                    <SelectItem value={CouponUseType.ONCE_PER_USER}>
                      Once Per User
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={bulkCreateData.validFrom}
                  onChange={(e) =>
                    setBulkCreateData({
                      ...bulkCreateData,
                      validFrom: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={bulkCreateData.validUntil}
                  onChange={(e) =>
                    setBulkCreateData({
                      ...bulkCreateData,
                      validUntil: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cannotCombine"
                  checked={bulkCreateData.cannotCombineWithOtherCoupons}
                  onCheckedChange={(checked) =>
                    setBulkCreateData({
                      ...bulkCreateData,
                      cannotCombineWithOtherCoupons: !!checked,
                    })
                  }
                />
                <Label htmlFor="cannotCombine">
                  Cannot combine with other coupons
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresId"
                  checked={bulkCreateData.requiresIdVerification}
                  onCheckedChange={(checked) =>
                    setBulkCreateData({
                      ...bulkCreateData,
                      requiresIdVerification: !!checked,
                    })
                  }
                />
                <Label htmlFor="requiresId">Requires ID verification</Label>
              </div>
            </div>

            <Button
              onClick={handleBulkCreate}
              disabled={loading || bulkCreateData.count < 1}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Coupons...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create {bulkCreateData.count} Coupons
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bulk Update */}
      {operation === "update" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Bulk Update Coupons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="couponIds">Coupon IDs (one per line)</Label>
              <Textarea
                id="couponIds"
                value={bulkUpdateData.couponIds}
                onChange={(e) =>
                  setBulkUpdateData({
                    ...bulkUpdateData,
                    couponIds: e.target.value,
                  })
                }
                placeholder="Enter coupon IDs, one per line..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field">Field to Update</Label>
                <Select
                  value={bulkUpdateData.field}
                  onValueChange={(value) =>
                    setBulkUpdateData({ ...bulkUpdateData, field: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">New Value</Label>
                <Input
                  id="value"
                  value={bulkUpdateData.value}
                  onChange={(e) =>
                    setBulkUpdateData({
                      ...bulkUpdateData,
                      value: e.target.value,
                    })
                  }
                  placeholder="Enter new value..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Update</Label>
              <Textarea
                id="reason"
                value={bulkUpdateData.reason}
                onChange={(e) =>
                  setBulkUpdateData({
                    ...bulkUpdateData,
                    reason: e.target.value,
                  })
                }
                placeholder="Enter reason for bulk update..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleBulkUpdate}
              disabled={loading || !bulkUpdateData.couponIds.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Coupons...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Coupons
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bulk Assign */}
      {operation === "assign" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk Assign Coupons
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="couponIds">Coupon IDs (one per line)</Label>
              <Textarea
                id="couponIds"
                value={bulkAssignData.couponIds}
                onChange={(e) =>
                  setBulkAssignData({
                    ...bulkAssignData,
                    couponIds: e.target.value,
                  })
                }
                placeholder="Enter coupon IDs, one per line..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userIds">User IDs (one per line)</Label>
              <Textarea
                id="userIds"
                value={bulkAssignData.userIds}
                onChange={(e) =>
                  setBulkAssignData({
                    ...bulkAssignData,
                    userIds: e.target.value,
                  })
                }
                placeholder="Enter user IDs, one per line..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Assignment Reason</Label>
              <Textarea
                id="reason"
                value={bulkAssignData.reason}
                onChange={(e) =>
                  setBulkAssignData({
                    ...bulkAssignData,
                    reason: e.target.value,
                  })
                }
                placeholder="Enter reason for assignment..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleBulkAssign}
              disabled={
                loading ||
                !bulkAssignData.couponIds.trim() ||
                !bulkAssignData.userIds.trim()
              }
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning Coupons...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Assign Coupons
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Operation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium text-sm">
                        {result.couponTitle || `Operation ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {result.type} - {result.couponId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                    {result.error && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {result.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkCouponOperations;
