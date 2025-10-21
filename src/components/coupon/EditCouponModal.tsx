"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  Percent,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { Coupon, CouponType, CouponVisibility, CouponStatus } from "@/types";

interface EditCouponModalProps {
  coupon: Coupon | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (couponId: string, data: EditCouponData) => Promise<void>;
  loading?: boolean;
}

export interface EditCouponData {
  title: string;
  description: string;
  type: CouponType;
  value: string;
  validFrom: string;
  validUntil: string;
  maxUses: string;
  status: CouponStatus;
  couponType: CouponVisibility;
  requiresReview: boolean;
}

const EditCouponModal: React.FC<EditCouponModalProps> = ({
  coupon,
  isOpen,
  onClose,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState<EditCouponData>({
    title: "",
    description: "",
    type: CouponType.FIXED_AMOUNT,
    value: "",
    validFrom: "",
    validUntil: "",
    maxUses: "",
    status: CouponStatus.DRAFT,
    couponType: CouponVisibility.PUBLIC,
    requiresReview: false,
  });
  const [errors, setErrors] = useState<Partial<EditCouponData>>({});

  useEffect(() => {
    if (coupon) {
      setFormData({
        title: coupon.title,
        description: coupon.description || "",
        type: coupon.type,
        value: coupon.value.toString(),
        validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
        validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
        maxUses: coupon.maxUses?.toString() || "",
        status: coupon.status,
        couponType: coupon.couponType,
        requiresReview: coupon.requiresReview,
      });
      setErrors({});
    }
  }, [coupon]);

  const handleInputChange = (
    field: keyof EditCouponData,
    value: string | boolean | CouponType | CouponVisibility | CouponStatus,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<EditCouponData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.value.trim()) {
      newErrors.value = "Value is required";
    } else if (isNaN(Number(formData.value)) || Number(formData.value) <= 0) {
      newErrors.value = "Value must be a positive number";
    }

    if (!formData.validFrom) {
      newErrors.validFrom = "Valid from date is required";
    }

    if (!formData.validUntil) {
      newErrors.validUntil = "Valid until date is required";
    } else if (
      formData.validFrom &&
      new Date(formData.validFrom) >= new Date(formData.validUntil)
    ) {
      newErrors.validUntil = "Valid until must be after valid from date";
    }

    if (
      formData.maxUses &&
      (isNaN(Number(formData.maxUses)) || Number(formData.maxUses) <= 0)
    ) {
      newErrors.maxUses = "Max uses must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && coupon) {
      await onSave(coupon.id, formData);
      onClose();
    }
  };

  if (!coupon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Coupon</DialogTitle>
          <DialogDescription>
            Update the details of your coupon.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coupon Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Coupon Type</Label>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.couponType === CouponVisibility.PUBLIC
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-200 dark:border-gray-700"
                }`}
                onClick={() =>
                  handleInputChange("couponType", CouponVisibility.PUBLIC)
                }
              >
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">Public</span>
                  <Badge variant="secondary">Anyone can claim</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visible to all users on the platform
                </p>
              </div>
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.couponType === CouponVisibility.PRIVATE
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-gray-200 dark:border-gray-700"
                }`}
                onClick={() =>
                  handleInputChange("couponType", CouponVisibility.PRIVATE)
                }
              >
                <div className="flex items-center gap-2 mb-2">
                  <EyeOff className="h-4 w-4" />
                  <span className="font-medium">Private</span>
                  <Badge variant="outline">Assigned only</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Only assigned users can use this coupon
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Coupon Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., 20% Off Your First Order"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe what this coupon offers..."
                rows={3}
              />
            </div>
          </div>

          {/* Value and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Discount Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  handleInputChange("type", value as CouponType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CouponType.FIXED_AMOUNT}>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fixed Amount
                    </div>
                  </SelectItem>
                  <SelectItem value={CouponType.PERCENTAGE}>
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Percentage
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => handleInputChange("value", e.target.value)}
                placeholder={
                  formData.type === CouponType.PERCENTAGE ? "20" : "10"
                }
                className={errors.value ? "border-red-500" : ""}
              />
              {errors.value && (
                <p className="text-sm text-red-500 mt-1">{errors.value}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                handleInputChange("status", value as CouponStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CouponStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={CouponStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={CouponStatus.PAUSED}>Paused</SelectItem>
                <SelectItem value={CouponStatus.EXPIRED}>Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom">Valid From *</Label>
              <Input
                id="validFrom"
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => handleInputChange("validFrom", e.target.value)}
                className={errors.validFrom ? "border-red-500" : ""}
              />
              {errors.validFrom && (
                <p className="text-sm text-red-500 mt-1">{errors.validFrom}</p>
              )}
            </div>

            <div>
              <Label htmlFor="validUntil">Valid Until *</Label>
              <Input
                id="validUntil"
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) =>
                  handleInputChange("validUntil", e.target.value)
                }
                className={errors.validUntil ? "border-red-500" : ""}
              />
              {errors.validUntil && (
                <p className="text-sm text-red-500 mt-1">{errors.validUntil}</p>
              )}
            </div>
          </div>

          {/* Usage Limits */}
          <div>
            <Label htmlFor="maxUses">Maximum Uses (Optional)</Label>
            <Input
              id="maxUses"
              type="number"
              value={formData.maxUses}
              onChange={(e) => handleInputChange("maxUses", e.target.value)}
              placeholder="Leave empty for unlimited"
              className={errors.maxUses ? "border-red-500" : ""}
            />
            {errors.maxUses && (
              <p className="text-sm text-red-500 mt-1">{errors.maxUses}</p>
            )}
          </div>

          {/* Review Requirement (only for public coupons) */}
          {formData.couponType === CouponVisibility.PUBLIC && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresReview"
                checked={formData.requiresReview}
                onChange={(e) =>
                  handleInputChange("requiresReview", e.target.checked)
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="requiresReview" className="text-sm">
                Require users to review this business before claiming another
                coupon
              </Label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCouponModal;
