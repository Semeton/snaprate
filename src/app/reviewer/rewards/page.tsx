"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Gift, 
  DollarSign, 
  Users, 
  TrendingUp, 
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Smartphone,
  CreditCard
} from "lucide-react";

interface Reward {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  reviewId?: string;
}

interface RewardStats {
  totalEarnings: number;
  pendingAmount: number;
  redeemedAmount: number;
  availableForRedemption: number;
}

export default function RewardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchRewardsData();
    }
  }, [session, status]);

  const fetchRewardsData = async () => {
    try {
      setLoading(true);
      
      // Fetch rewards
      const rewardsResponse = await fetch("/api/rewards");
      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRewards(rewardsData.data || []);
      }

      // Fetch reward stats
      const statsResponse = await fetch("/api/reviewer/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalEarnings: statsData.totalEarnings || 0,
          pendingAmount: 0, // Will be calculated from rewards
          redeemedAmount: 0, // Will be calculated from rewards
          availableForRedemption: 0, // Will be calculated
        });
      }
    } catch (error) {
      console.error("Failed to fetch rewards data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemAirtime = async () => {
    if (!stats || stats.availableForRedemption < 1000) {
      setMessage({
        type: "error",
        text: "You need at least ₦1,000 to redeem airtime"
      });
      return;
    }

    setRedeeming(true);
    try {
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "AIRTIME",
          amount: stats.availableForRedemption,
        }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Successfully redeemed ₦${stats.availableForRedemption} worth of airtime!`
        });
        fetchRewardsData(); // Refresh data
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.error || "Failed to redeem airtime"
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while redeeming airtime"
      });
    } finally {
      setRedeeming(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!stats || stats.availableForRedemption < 1000) {
      setMessage({
        type: "error",
        text: "You need at least ₦1,000 to redeem coupons"
      });
      return;
    }

    setRedeeming(true);
    try {
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "COUPON",
          amount: stats.availableForRedemption,
        }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Successfully redeemed ₦${stats.availableForRedemption} worth of coupons!`
        });
        fetchRewardsData(); // Refresh data
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.error || "Failed to redeem coupons"
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while redeeming coupons"
      });
    } finally {
      setRedeeming(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  // Calculate stats from rewards
  const calculatedStats = {
    totalEarnings: stats?.totalEarnings || 0,
    pendingAmount: rewards.filter(r => r.status === "PENDING").reduce((sum, r) => sum + r.amount, 0),
    redeemedAmount: rewards.filter(r => r.status === "APPROVED").reduce((sum, r) => sum + r.amount, 0),
    availableForRedemption: (stats?.totalEarnings || 0) - rewards.filter(r => r.status === "APPROVED").reduce((sum, r) => sum + r.amount, 0)
  };

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
              <h1 className="text-2xl font-bold text-gray-900">My Rewards</h1>
              <p className="text-gray-600">Track your earnings and redeem rewards</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message && (
          <Alert className={`mb-6 ${
            message.type === "success" 
              ? "border-green-500 bg-green-50" 
              : "border-red-500 bg-red-50"
          }`}>
            <AlertDescription className={
              message.type === "success" ? "text-green-700" : "text-red-700"
            }>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{calculatedStats.totalEarnings}</div>
              <p className="text-xs text-muted-foreground">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{calculatedStats.pendingAmount}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{calculatedStats.redeemedAmount}</div>
              <p className="text-xs text-muted-foreground">
                Already redeemed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{calculatedStats.availableForRedemption}</div>
              <p className="text-xs text-muted-foreground">
                Ready to redeem
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Redemption Section */}
        {calculatedStats.availableForRedemption >= 1000 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Redeem Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                You have ₦{calculatedStats.availableForRedemption} available for redemption. 
                Minimum redemption amount is ₦1,000.
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={handleRedeemAirtime}
                  disabled={redeeming}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  {redeeming ? "Processing..." : "Redeem Airtime"}
                </Button>
                <Button
                  onClick={handleRedeemCoupon}
                  disabled={redeeming}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {redeeming ? "Processing..." : "Redeem Coupons"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rewards History */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Rewards</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                {rewards.length > 0 ? (
                  <div className="space-y-4">
                    {rewards.map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(reward.status)}
                          <div>
                            <p className="font-medium">{reward.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(reward.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+₦{reward.amount}</p>
                          <Badge className={getStatusColor(reward.status)}>
                            {reward.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No rewards yet. Submit reviews to start earning!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                {rewards.filter(r => r.status === "PENDING").length > 0 ? (
                  <div className="space-y-4">
                    {rewards.filter(r => r.status === "PENDING").map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <div>
                            <p className="font-medium">{reward.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(reward.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+₦{reward.amount}</p>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            PENDING
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No pending rewards</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Approved Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                {rewards.filter(r => r.status === "APPROVED").length > 0 ? (
                  <div className="space-y-4">
                    {rewards.filter(r => r.status === "APPROVED").map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="font-medium">{reward.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(reward.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+₦{reward.amount}</p>
                          <Badge className="bg-green-100 text-green-800">
                            APPROVED
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No approved rewards yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
