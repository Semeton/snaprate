"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Percent,
  Gift,
  RefreshCw,
  Star,
} from "lucide-react";
import { Coupon, CouponVisibility, BusinessCategory } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import PublicNavigation from "@/components/PublicNavigation";

export default function PublicCouponsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchCoupons();
  }, [selectedCategory]);

  const fetchCoupons = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: "20",
        offset: reset ? "0" : offset.toString(),
      });

      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      const response = await fetch(`/api/coupons/public?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch coupons");
      }

      const data = await response.json();

      if (reset) {
        setCoupons(data.coupons);
        setOffset(20);
      } else {
        setCoupons((prev) => [...prev, ...data.coupons]);
        setOffset((prev) => prev + 20);
      }

      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      setError("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Searching for:", searchTerm);
  };

  const handleClaimCoupon = async (couponId: string) => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    try {
      const response = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ couponId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Coupon claimed successfully!");
        // Refresh the coupons list
        fetchCoupons(true);
      } else {
        alert(data.error || "Failed to claim coupon");
      }
    } catch (error) {
      console.error("Failed to claim coupon:", error);
      alert("Failed to claim coupon");
    }
  };

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.business.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Discover Coupons
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Find amazing deals from local businesses
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search coupons or businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={handleSearch} className="md:w-auto">
            Search
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="RESTAURANT">Restaurants</SelectItem>
              <SelectItem value="RETAIL">Retail</SelectItem>
              <SelectItem value="SERVICES">Services</SelectItem>
              <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
              <SelectItem value="BEAUTY">Beauty & Wellness</SelectItem>
              <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
              <SelectItem value="EDUCATION">Education</SelectItem>
              <SelectItem value="AUTOMOTIVE">Automotive</SelectItem>
              <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => fetchCoupons(true)}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Gift className="h-12 w-12 mx-auto mb-2" />
            <p>{error}</p>
          </div>
          <Button onClick={() => fetchCoupons(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Coupons Grid */}
      {filteredCoupons.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No coupons found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filters to find more coupons.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => (
            <Card key={coupon.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {coupon.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{coupon.business.name}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {coupon.business.category}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {coupon.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {coupon.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {coupon.type === "PERCENTAGE" ? (
                      <Percent className="h-5 w-5 text-green-600" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-green-600" />
                    )}
                    <span className="text-2xl font-bold text-green-600">
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}%`
                        : formatCurrency(coupon.value)}
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Valid until</p>
                    <p className="font-medium">
                      {formatDate(coupon.validUntil)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {coupon.currentUses}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : ""} claimed
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>4.5</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleClaimCoupon(coupon.id)}
                  disabled={coupon.assignedUserId !== null}
                >
                  {coupon.assignedUserId ? "Already Claimed" : "Claim Coupon"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <Button
            onClick={() => fetchCoupons(false)}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Loading..." : "Load More Coupons"}
          </Button>
        </div>
      )}
    </div>
  );
}
