"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star, Gift, Phone, AlertCircle, CheckCircle, X } from "lucide-react";

interface Reward {
  id: string;
  type: string;
  amount: number;
  description: string;
  isRedeemed: boolean;
  redeemedAt?: Date;
  createdAt: Date;
}

interface RewardRedemptionProps {
  onRewardRedeemed: () => void;
}

export default function RewardRedemption({
  onRewardRedeemed,
}: RewardRedemptionProps) {
  const { data: session } = useSession();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [redemptionType, setRedemptionType] = useState<"AIRTIME" | "COUPON">(
    "AIRTIME",
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchRewards();
    }
  }, [session]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rewards");
      if (response.ok) {
        const data = await response.json();
        setRewards(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemClick = (reward: Reward) => {
    setSelectedReward(reward);
    setShowRedemptionModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleRedemption = async () => {
    if (!selectedReward) return;

    if (redemptionType === "AIRTIME" && !phoneNumber.trim()) {
      setError("Phone number is required for airtime redemption");
      return;
    }

    try {
      setRedeeming(selectedReward.id);
      setError(null);

      const response = await fetch(`/api/rewards/${selectedReward.id}/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: redemptionType,
          phoneNumber: redemptionType === "AIRTIME" ? phoneNumber : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to redeem reward");
      }

      const result = await response.json();
      setSuccess(result.message);

      // Refresh rewards and close modal after 2 seconds
      setTimeout(() => {
        setShowRedemptionModal(false);
        setSelectedReward(null);
        setPhoneNumber("");
        setRedemptionType("AIRTIME");
        setSuccess(null);
        fetchRewards();
        onRewardRedeemed();
      }, 2000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to redeem reward",
      );
    } finally {
      setRedeeming(null);
    }
  };

  const closeModal = () => {
    if (!redeeming) {
      setShowRedemptionModal(false);
      setSelectedReward(null);
      setPhoneNumber("");
      setRedemptionType("AIRTIME");
      setError(null);
      setSuccess(null);
    }
  };

  const totalEarnings = rewards.reduce((sum, reward) => sum + reward.amount, 0);
  const availableForRedemption = rewards
    .filter((reward) => !reward.isRedeemed)
    .reduce((sum, reward) => sum + reward.amount, 0);
  const redeemedAmount = rewards
    .filter((reward) => reward.isRedeemed)
    .reduce((sum, reward) => sum + reward.amount, 0);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              My Rewards
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Earn rewards by reviewing businesses and redeem them for airtime
              or coupons
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              ₦{totalEarnings.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Total Earnings
                </p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                  ₦{totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Available
                </p>
                <p className="text-xl font-bold text-green-900 dark:text-green-100">
                  ₦{availableForRedemption.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Redeemed
                </p>
                <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                  ₦{redeemedAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Rewards
          </h3>

          {rewards.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No rewards yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start reviewing businesses to earn rewards!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.slice(0, 5).map((reward) => (
                <div
                  key={reward.id}
                  className={`p-4 rounded-lg border ${
                    reward.isRedeemed
                      ? "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            reward.isRedeemed
                              ? "bg-gray-100 dark:bg-gray-600"
                              : "bg-blue-100 dark:bg-blue-800"
                          }`}
                        >
                          <Gift
                            className={`h-4 w-4 ${
                              reward.isRedeemed
                                ? "text-gray-500 dark:text-gray-400"
                                : "text-blue-600 dark:text-blue-400"
                            }`}
                          />
                        </div>
                        <div>
                          <p
                            className={`font-medium ${
                              reward.isRedeemed
                                ? "text-gray-500 dark:text-gray-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {reward.description}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(reward.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-lg font-bold ${
                          reward.isRedeemed
                            ? "text-gray-500 dark:text-gray-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        ₦{reward.amount.toLocaleString()}
                      </span>

                      {reward.isRedeemed ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Redeemed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRedeemClick(reward)}
                          disabled={reward.amount < 1000}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            reward.amount >= 1000
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          }`}
                          title={
                            reward.amount < 1000
                              ? "Minimum ₦1,000 required for redemption"
                              : "Click to redeem"
                          }
                        >
                          {reward.amount >= 1000 ? "Redeem" : "Min ₦1,000"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rewards.length > 5 && (
            <div className="text-center pt-4">
              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                View all rewards
              </button>
            </div>
          )}
        </div>

        {/* Redemption Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Redemption Requirements:</p>
              <ul className="space-y-1">
                <li>• Minimum ₦1,000 required for redemption</li>
                <li>• Airtime: Provide valid phone number</li>
                <li>• Coupons: Available at partner businesses</li>
                <li>• Rewards are processed within 24-48 hours</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Redemption Modal */}
      {showRedemptionModal && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Redeem Reward
              </h3>
              <button
                onClick={closeModal}
                disabled={!!redeeming}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Success Message */}
            {success && (
              <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {success}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            {!success && (
              <div className="p-6 space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reward Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Amount:
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₦{selectedReward.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Description:
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedReward.description}
                    </p>
                  </div>
                </div>

                {/* Redemption Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Redemption Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRedemptionType("AIRTIME")}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        redemptionType === "AIRTIME"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">Airtime</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRedemptionType("COUPON")}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        redemptionType === "COUPON"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">Coupon</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Phone Number for Airtime */}
                {redemptionType === "AIRTIME" && (
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number for airtime"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={!!redeeming}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRedemption}
                    disabled={
                      !!redeeming ||
                      (redemptionType === "AIRTIME" && !phoneNumber.trim())
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {redeeming ? "Processing..." : "Redeem Now"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
