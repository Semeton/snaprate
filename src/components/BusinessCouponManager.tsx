"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Gift,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Copy,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CouponType, CouponUseType, CouponVisibility } from "@/types";
import CouponForm from "@/components/CouponForm";
import BulkCouponActions from "@/components/BulkCouponActions";

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
  visibility: CouponVisibility;
  assignedUser?: {
    id: string;
    name: string;
    userIdentifier: string;
  };
  createdAt: string;
}

export default function BusinessCouponManager() {
  const { data: session } = useSession();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/business/coupons");
      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);
        // Ensure coupons is always an array
        if (data && data.coupons) {
          setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
        } else {
          console.error("Invalid response format:", data);
          setCoupons([]);
        }
      } else {
        console.error("Failed to fetch coupons:", response.statusText);
        setCoupons([]);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = Array.isArray(coupons) 
    ? coupons.filter(
        (coupon) =>
          coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleCreateCoupon = async (formData) => {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/business/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setCoupons((prev) => [data.coupon, ...prev]);
        setShowCreateDialog(false);
        return true;
      } else {
        setError(data.error || "Failed to create coupon");
        return false;
      }
    } catch (error) {
      setError("Failed to create coupon");
      return false;
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadCouponPDF = async (couponId: string) => {
    try {
      const response = await fetch(`/api/business/coupons/${couponId}/pdf`);

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
      const response = await fetch(`/api/business/coupons/${couponId}/qr`);

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
              <button onclick="window.print()">Print QR Code</button>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to generate QR code. Please try again.");
    }
  };

  // const filteredCoupons = coupons.filter(
  //   (coupon) =>
  //     coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Coupons</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
              </DialogHeader>
              <CouponForm 
                onSubmit={handleCreateCoupon} 
                onCancel={() => setShowCreateDialog(false)}
                isSubmitting={creating}
                error={error}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Coupon Actions */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Bulk Coupon Actions</h3>
        <BulkCouponActions coupons={coupons} onSuccess={fetchCoupons} />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading coupons...</div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No coupons found. Create your first coupon to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => (
            <Card key={coupon.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{coupon.title}</CardTitle>
                  <Badge
                    variant={
                      coupon.visibility === "PUBLIC" ? "default" : "outline"
                    }
                  >
                    {coupon.visibility === "PUBLIC" ? "Public" : "Private"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {coupon.description || "No description"}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}% off`
                        : formatCurrency(coupon.value)}
                    </span>
                  </div>
                  <Badge
                    variant={
                      coupon.status === "ACTIVE" ? "default" : "destructive"
                    }
                  >
                    {coupon.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                    <span>
                      {formatDate(coupon.validFrom)} -{" "}
                      {formatDate(coupon.validUntil)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-gray-500" />
                    <span>
                      {coupon.totalIssued} issued, {coupon.totalRedeemed} used
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Code:</span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {coupon.baseCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(coupon.baseCode)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => downloadCouponPDF(coupon.id)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => generateQRCode(coupon.id)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
