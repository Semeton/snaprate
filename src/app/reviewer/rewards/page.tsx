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
  Gift,
  Phone,
  Ticket,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  MessageSquare,
  TrendingUp,
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
  totalReviews: number;
  totalRewards: number;
  totalReferrals: number;
  averageRating: number;
  currentStreak: number;
  monthlyReviews: number;
  monthlyRewards: number;
  rewardBreakdown: {
    reviewReward: number;
    referralReward: number;
    businessRecommendationReward: number;
  };
  currentRates: {
    reviewReward: number;
    referralReward: number;
    businessRecommendationReward: number;
  };
  userRole: string;
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

      // Fetch user stats from the correct API
      const statsResponse = await fetch("/api/reviewer/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        // Rewards page stats received
        const userStats = statsData.data;

        // Fetch platform settings for minimum redemption amount
        const settingsResponse = await fetch("/api/admin/settings");
        let minimumRedemption = 5000; // Default fallback

        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          minimumRedemption =
            settingsData.data?.minimumRedemptionAmount || 5000;
        }

        // Add redemption logic
        const canRedeem = userStats.totalRewards >= minimumRedemption;

        setStats({
          ...userStats,
          canRedeem,
          minimumRedemption: minimumRedemption || 5000, // Ensure it's always defined
        });
      } else {
        console.error(
          "Failed to fetch rewards stats:",
          statsResponse.status,
          statsResponse.statusText,
        );
      }

      // Fetch recent rewards
      const rewardsResponse = await fetch("/api/dashboard/rewards?limit=10");
      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRewards(rewardsData.data?.rewards || []);
      }

      // Fetch redemption history
      const redemptionResponse = await fetch("/api/rewards/redeem");
      if (redemptionResponse.ok) {
        const redemptionData = await redemptionResponse.json();
        setRedemptions(redemptionData.data?.redemptions || []);
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
    const minAmount = stats?.minimumRedemption || 5000;
    if (isNaN(amount) || amount < minAmount) {
      setError(`Minimum redemption amount is ₦${minAmount}`);
      return;
    }

    if (amount > (stats?.totalRewards || 0)) {
      setError("Insufficient balance for this redemption");
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
      console.log(error);
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
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";
      case "PROCESSED":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
      case "FAILED":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading rewards...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Rewards
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and redeem your earned rewards
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{stats?.totalRewards || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReviews || 0}</div>
            <p className="text-xs text-muted-foreground">Reviews submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Referrals
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalReferrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">Friends referred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageRating?.toFixed(1) || "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">Review rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Reward Rates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 dark:text-white">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>Current Reward Rates</span>
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These rates are set by the platform and may change over time
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <MessageSquare className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                ₦{stats?.currentRates?.reviewReward || 50}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Per Review
              </p>
            </div>

            <div className="text-center p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                ₦{stats?.currentRates?.referralReward || 20}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Per Referral
              </p>
            </div>

            <div className="text-center p-3 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                ₦{stats?.currentRates?.businessRecommendationReward || 100}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Per Business Rec.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 dark:text-white">
            <Gift className="h-5 w-5 text-green-600" />
            <span>Reward Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                ₦{stats?.rewardBreakdown?.reviewReward || 0}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                From Reviews
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ₦{stats?.currentRates?.reviewReward || 50} ×{" "}
                {stats?.totalReviews || 0} reviews
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                ₦{stats?.rewardBreakdown?.referralReward || 0}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                From Referrals
              </p>
              <p className="text-xs text-green-600 mt-1">
                ₦{stats?.currentRates?.referralReward || 20} ×{" "}
                {stats?.totalReferrals || 0} referrals
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                ₦{stats?.rewardBreakdown?.businessRecommendationReward || 0}
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                From Business Recs
              </p>
              <p className="text-xs text-purple-600 mt-1">
                ₦{stats?.currentRates?.businessRecommendationReward || 100} ×
                approved businesses
              </p>
            </div>
          </div>

          {stats?.userRole === "AGENT" && (
            <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-950/30 rounded-lg">
              <p className="text-sm text-purple-800 dark:text-purple-200 text-center">
                🎉 As an Agent, you can earn ₦
                {stats?.currentRates?.businessRecommendationReward || 100} for
                each approved business recommendation!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redemption Form */}
      {stats?.canRedeem ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="dark:text-white">Redeem Rewards</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Convert your rewards to airtime or coupons. Minimum redemption: ₦
              {stats?.minimumRedemption || 5000}
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
                      setRedemptionForm((prev) => ({
                        ...prev,
                        type: value,
                      }))
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
                    min={stats?.minimumRedemption || 5000}
                    max={stats?.totalRewards || 5000}
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
      ) : (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="text-center">
              <Gift className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-yellow-900 mb-2">
                Not Enough Rewards to Redeem
              </h3>
              <p className="text-yellow-800 mb-4">
                You need at least ₦{stats?.minimumRedemption || 5000} to redeem
                rewards.
              </p>
              <div className="space-y-2 text-sm text-yellow-700">
                <p>Current balance: ₦{stats?.totalRewards || 0}</p>
                <p>
                  Keep reviewing businesses and referring friends to earn more!
                </p>
              </div>
            </div>
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
              <p>No rewards yet. Start reviewing businesses to earn rewards!</p>
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
  );
}
