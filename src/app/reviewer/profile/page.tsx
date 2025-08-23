"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Gift,
  MessageSquare,
  Shield,
} from "lucide-react";
import { State } from "@/types";
import Image from "next/image";
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  state: State;
  city: string;
  address: string;
  avatar: string;
  dateOfBirth: string;
  gender: string;
  referralCode: string;
  isVerified: boolean;
  createdAt: string;
}

interface ProfileStats {
  totalReviews: number;
  totalRewards: number;
  totalReferrals: number;
  averageRating: number;
  currentStreak: number;
  monthlyReviews: number;
  monthlyRewards: number;
  rewardBreakdown?: {
    reviewReward: number;
    referralReward: number;
    businessRecommendationReward: number;
  };
  userRole: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchProfileData();
    }
  }, [session, status]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const profileResponse = await fetch("/api/user/profile");
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData.data);
      }

      // Fetch user stats from the correct API
      const statsResponse = await fetch("/api/reviewer/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        // Profile stats received
        setStats(statsData.data);
      } else {
        console.error(
          "Failed to fetch profile stats:",
          statsResponse.status,
          statsResponse.statusText,
        );
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatState = (state: string) => {
    return state.replace(/_/g, " ");
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">
            Profile Not Found
          </div>
          <p className="text-gray-600 mb-4">
            Unable to load your profile information.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">
          View and manage your account information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-center space-x-6">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 font-medium text-3xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.name}
                  </h2>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge
                      variant={profile.isVerified ? "default" : "secondary"}
                    >
                      {profile.isVerified ? "Verified" : "Pending Verification"}
                    </Badge>
                    <Badge variant="outline">
                      {session?.user?.role === "AGENT" ? "Agent" : "Reviewer"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-900">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-gray-900">
                        {profile.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Date of Birth
                      </p>
                      <p className="text-gray-900">
                        {profile.dateOfBirth
                          ? formatDate(profile.dateOfBirth)
                          : "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Gender
                      </p>
                      <p className="text-gray-900">
                        {profile.gender || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Address
                      </p>
                      <p className="text-gray-900">{profile.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">City</p>
                      <p className="text-gray-900">{profile.city}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">State</p>
                      <p className="text-gray-900">
                        {formatState(profile.state)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Referral Code
                      </p>
                      <p className="text-gray-900 font-mono">
                        {profile.referralCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Member Since
                    </p>
                    <p className="text-gray-900">
                      {formatDate(profile.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Account Status
                    </p>
                    <Badge
                      variant={profile.isVerified ? "default" : "secondary"}
                    >
                      {profile.isVerified ? "Active" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Activity Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 border rounded-lg">
                  <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalReviews || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Gift className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    ₦{stats?.totalRewards || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Rewards</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalReferrals || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Referrals</p>
                </div>
              </div>

              {/* Reward Breakdown */}
              {stats && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Reward Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Reviews:</span>
                      <span className="font-medium">
                        ₦{stats.rewardBreakdown?.reviewReward || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Referrals:</span>
                      <span className="font-medium">
                        ₦{stats.rewardBreakdown?.referralReward || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Business Recs:</span>
                      <span className="font-medium">
                        ₦
                        {stats.rewardBreakdown?.businessRecommendationReward ||
                          0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push("/reviewer/settings")}
                className="w-full justify-start"
                variant="outline"
              >
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                onClick={() => router.push("/reviewer/submit-review")}
                className="w-full justify-start"
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Write Review
              </Button>
              {session?.user?.role !== "AGENT" && (
                <Button
                  onClick={() => router.push("/reviewer/apply-agent")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Apply to be Agent
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Referral Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Referral Program</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-blue-700 text-sm mb-3">
                  Share your referral code and earn ₦20 for each friend who
                  signs up!
                </p>
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-gray-600 mb-1">
                    Your Referral Code
                  </p>
                  <p className="font-mono font-bold text-lg text-blue-600">
                    {profile.referralCode}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(profile.referralCode);
                    // You could add a toast notification here
                  }}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  Copy Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
