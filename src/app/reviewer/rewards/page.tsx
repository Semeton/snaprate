"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Gift,
  DollarSign,
  Phone,
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface Reward {
  id: string;
  type: string;
  amount: number;
  description: string;
  isRedeemed: boolean;
  createdAt: string;
}

interface Redemption {
  id: string;
  type: string;
  amount: number;
  phone?: string;
  status: string;
  createdAt: string;
  processedAt?: string;
}

interface RewardStats {
  totalRewards: number;
  totalAmount: number;
  redeemedRewards: number;
  availableBalance: number;
  canRedeem: boolean;
  minimumRedemption: number;
}

export default function RewardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [redemptionForm, setRedemptionForm] = useState({
    type: "",
    amount: "",
    phone: "",
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchRewardsData();
    }
  }, [session, status]);

  const fetchRewardsData = async () => {
    try {
      setLoading(true);

      // Fetch rewards
      const rewardsResponse = await fetch("/api/dashboard/rewards");
      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRewards(rewardsData.data.rewards || []);
      }

      // Fetch redemption history and stats
      const redemptionResponse = await fetch("/api/rewards/redeem");
      if (redemptionResponse.ok) {
        const redemptionData = await redemptionResponse.json();
        setRedemptions(redemptionData.data.redemptions || []);
        setStats(redemptionData.data);
      }
    } catch (error) {
      console.error("Failed to fetch rewards data:", error);
      setError("Failed to load rewards data");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!redemptionForm.type || !redemptionForm.amount) {
      setError("Please fill in all required fields");
      return;
    }

    if (redemptionForm.type === "AIRTIME" && !redemptionForm.phone) {
      setError("Phone number is required for airtime redemption");
      return;
    }

    const amount = parseFloat(redemptionForm.amount);
    if (isNaN(amount) || amount < 1000) {
      setError("Minimum redemption amount is ₦1000");
      return;
    }

    setRedeemLoading(true);
    setError("");

    try {
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: redemptionForm.type,
          amount: amount,
          phone:
            redemptionForm.type === "AIRTIME"
              ? redemptionForm.phone
              : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setRedemptionForm({ type: "", amount: "", phone: "" });

        // Refresh data
        setTimeout(() => {
          fetchRewardsData();
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to redeem rewards");
      }
    } catch (error) {
      setError("An error occurred while redeeming rewards");
    } finally {
      setRedeemLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "PROCESSED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Rewards</h1>
              <p className="text-gray-600">
                View and redeem your earned rewards
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earned
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{stats?.totalAmount || 0}
              </div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{stats?.availableBalance || 0}
              </div>
              <p className="text-xs text-muted-foreground">Ready to redeem</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Rewards
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalRewards || 0}
              </div>
              <p className="text-xs text-muted-foreground">Rewards earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.redeemedRewards || 0}
              </div>
              <p className="text-xs text-muted-foreground">Already redeemed</p>
            </CardContent>
          </Card>
        </div>

        {/* Redemption Form */}
        {stats?.canRedeem && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Redeem Rewards</CardTitle>
              <p className="text-sm text-gray-600">
                Convert your rewards to airtime or coupons. Minimum redemption:
                ₦{stats.minimumRedemption}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRedeem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">
                      Redemption Type *
                    </Label>
                    <Select
                      value={redemptionForm.type}
                      onValueChange={(value) =>
                        setRedemptionForm((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AIRTIME">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>Airtime</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="COUPON">
                          <div className="flex items-center space-x-2">
                            <Ticket className="h-4 w-4" />
                            <span>Coupon</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium">
                      Amount (₦) *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={redemptionForm.amount}
                      onChange={(e) =>
                        setRedemptionForm((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="Enter amount"
                      min="1000"
                      step="100"
                      className="mt-1"
                      required
                    />
                  </div>

                  {redemptionForm.type === "AIRTIME" && (
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={redemptionForm.phone}
                        onChange={(e) =>
                          setRedemptionForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="Enter phone number"
                        className="mt-1"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={redeemLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {redeemLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Gift className="h-4 w-4" />
                        <span>Redeem Rewards</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>

              {error && (
                <Alert className="border-red-500 bg-red-50 mt-4">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50 mt-4">
                  <AlertDescription className="text-green-700 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{success}</span>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Rewards */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            {rewards.length > 0 ? (
              <div className="space-y-4">
                {rewards.slice(0, 10).map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Gift className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{reward.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(reward.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        +₦{reward.amount}
                      </p>
                      <Badge
                        variant={reward.isRedeemed ? "default" : "secondary"}
                      >
                        {reward.isRedeemed ? "REDEEMED" : "PENDING"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  No rewards yet. Start reviewing businesses to earn rewards!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redemption History */}
        <Card>
          <CardHeader>
            <CardTitle>Redemption History</CardTitle>
          </CardHeader>
          <CardContent>
            {redemptions.length > 0 ? (
              <div className="space-y-4">
                {redemptions.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {redemption.type === "AIRTIME" ? (
                        <Phone className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Ticket className="h-5 w-5 text-purple-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {redemption.type} Redemption
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(redemption.createdAt).toLocaleDateString()}
                        </p>
                        {redemption.phone && (
                          <p className="text-xs text-gray-400">
                            Phone: {redemption.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        -₦{redemption.amount}
                      </p>
                      <Badge className={getStatusColor(redemption.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(redemption.status)}
                          <span>{redemption.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No redemptions yet. Redeem your rewards to see them here!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
