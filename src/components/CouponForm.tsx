"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CouponType, CouponUseType, CouponVisibility } from "@/types";

interface CouponFormProps {
  initialData?: {
    title: string;
    description: string;
    type: CouponType;
    value: string;
    minimumOrderAmount: string;
    maximumDiscount: string;
    maxUses: string;
    validFrom: string;
    validUntil: string;
    useType: CouponUseType;
    allowedDaysOfWeek: number[];
    allowedTimeStart: string;
    allowedTimeEnd: string;
    cannotCombineWithOtherCoupons: boolean;
    requiresIdVerification: boolean;
    visibility: CouponVisibility;
    maxUsesPerUser: string;
  };
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function CouponForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting
}: CouponFormProps) {
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
    visibility: "PUBLIC" as CouponVisibility,
    maxUsesPerUser: "1",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const toggleAllowedDay = (day: number) => {
    setFormData((prev) => {
      const newDays = [...prev.allowedDaysOfWeek];
      if (newDays.includes(day)) {
        return {
          ...prev,
          allowedDaysOfWeek: newDays.filter((d) => d !== day),
        };
      } else {
        return { ...prev, allowedDaysOfWeek: [...newDays, day] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Coupon Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g. Summer Sale"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Coupon Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleSelectChange("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
              <SelectItem value="PERCENTAGE">Percentage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe your coupon"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="value">
            {formData.type === "FIXED_AMOUNT" ? "Amount ($)" : "Percentage (%)"}
          </Label>
          <Input
            id="value"
            name="value"
            type="number"
            value={formData.value}
            onChange={handleInputChange}
            placeholder={formData.type === "FIXED_AMOUNT" ? "10.00" : "15"}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minimumOrderAmount">Minimum Order Amount ($)</Label>
          <Input
            id="minimumOrderAmount"
            name="minimumOrderAmount"
            type="number"
            value={formData.minimumOrderAmount}
            onChange={handleInputChange}
            placeholder="0.00"
          />
        </div>
      </div>

      {formData.type === "PERCENTAGE" && (
        <div className="space-y-2">
          <Label htmlFor="maximumDiscount">Maximum Discount ($)</Label>
          <Input
            id="maximumDiscount"
            name="maximumDiscount"
            type="number"
            value={formData.maximumDiscount}
            onChange={handleInputChange}
            placeholder="50.00"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="validFrom">Valid From</Label>
          <Input
            id="validFrom"
            name="validFrom"
            type="date"
            value={formData.validFrom}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="validUntil">Valid Until</Label>
          <Input
            id="validUntil"
            name="validUntil"
            type="date"
            value={formData.validUntil}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="useType">Usage Type</Label>
          <Select
            value={formData.useType}
            onValueChange={(value) => handleSelectChange("useType", value as CouponUseType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select usage type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE_USE">Single Use</SelectItem>
              <SelectItem value="MULTI_USE">Multi Use</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.useType === "MULTI_USE" && (
          <div className="space-y-2">
            <Label htmlFor="maxUses">Maximum Uses</Label>
            <Input
              id="maxUses"
              name="maxUses"
              type="number"
              value={formData.maxUses}
              onChange={handleInputChange}
              placeholder="10"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Visibility</Label>
        <Select
          value={formData.visibility}
          onValueChange={(value) => handleSelectChange("visibility", value as CouponVisibility)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Public - Any reviewer can claim</SelectItem>
            <SelectItem value="PRIVATE">Private - Must be manually assigned</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 mt-1">
          {formData.visibility === "PUBLIC"
            ? "This coupon will be visible to all reviewers and can be claimed by anyone."
            : "This coupon will only be visible to you and must be manually assigned to specific reviewers."}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="requiresIdVerification"
            checked={formData.requiresIdVerification}
            onCheckedChange={(checked) => 
              handleCheckboxChange("requiresIdVerification", checked as boolean)
            }
          />
          <Label htmlFor="requiresIdVerification">
            Require ID verification for redemption
          </Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
}