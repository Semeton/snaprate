"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Settings,
  User,
  Shield,
  Key,
  Save,
  Eye,
  EyeOff,
  Camera,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  city: string;
  state: string;
  address: string;
  avatar?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSettingsConfirmation, setShowSettingsConfirmation] =
    useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    city: "",
    state: "",
    address: "",
  });

  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState({
    minimumRedemptionAmount: 5000,
    reviewRewardAmount: 50,
    referralRewardAmount: 20,
    businessRecommendationRewardAmount: 100,
    minimumBusinessesForAgent: 5,
    maxReviewsPerBusiness: 1,
    reviewModerationRequired: true,
    businessVerificationRequired: true,
  });

  useEffect(() => {
    fetchProfile();
    fetchPlatformSettings();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/admin/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        setProfileForm({
          name: data.data.name,
          phone: data.data.phone || "",
          city: data.data.city,
          state: data.data.state,
          address: data.data.address,
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformSettings = async () => {
    try {
      const response = await fetch("/api/admin/platform-settings");
      if (response.ok) {
        const data = await response.json();
        setPlatformSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch platform settings:", error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        fetchProfile();
        // Update session if name changed
        if (session?.user?.name !== profileForm.name) {
          await update();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/admin/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to change password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePlatformSettingsUpdate = async () => {
    // Validate minimum businesses for agent
    if (platformSettings.minimumBusinessesForAgent < 1) {
      toast({
        title: "Error",
        description: "Minimum businesses for agent must be at least 1",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(platformSettings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Platform settings updated successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update platform settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update platform settings:", error);
      toast({
        title: "Error",
        description: "Failed to update platform settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/admin/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Avatar updated successfully",
        });
        fetchProfile();
        await update();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update avatar",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update avatar:", error);
      toast({
        title: "Error",
        description: "Failed to update avatar",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load your profile information.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is super admin for platform settings access
  const isSuperAdmin = profile.role === "SUPER_ADMIN";

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your profile, security
            {isSuperAdmin ? ", and platform settings" : ""}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      width={1000}
                      height={1000}
                    />
                  ) : (
                    <User className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700">
                  <Camera className="h-3 w-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <p className="text-sm text-gray-600">Profile Picture</p>
                <p className="text-xs text-gray-500">
                  Click to upload new image
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  placeholder="+234..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profileForm.city}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profileForm.state}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, state: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, address: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <Button
              onClick={handleProfileUpdate}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Key className="h-4 w-4 mr-2" />
              {saving ? "Changing..." : "Change Password"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Platform Settings Access Notice for Regular Admins */}
      {!isSuperAdmin && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Platform Settings</span>
              <Badge variant="outline" className="ml-2">
                Restricted Access
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Platform Settings Access Restricted
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Platform settings can only be modified by Super Administrators.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Contact your Super Administrator if you need changes to
                platform-wide settings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Settings - Super Admin Only */}
      {isSuperAdmin && (
        <>
          {/* Platform Settings Description */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Platform Settings Management
                </h3>
                <p className="text-blue-700 text-sm">
                  Configure platform-wide settings that affect user rewards,
                  agent eligibility, and system behavior. Changes to these
                  settings only affect new activities, not existing rewards or
                  data.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Platform Settings</span>
                <Badge variant="secondary" className="ml-2">
                  Super Admin Only
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <Label htmlFor="minRedemption">Minimum Redemption (₦)</Label>
                  <Input
                    id="minRedemption"
                    type="number"
                    value={platformSettings.minimumRedemptionAmount}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        minimumRedemptionAmount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="reviewReward">Review Reward (₦)</Label>
                  <Input
                    id="reviewReward"
                    type="number"
                    value={platformSettings.reviewRewardAmount}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        reviewRewardAmount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="referralReward">Referral Reward (₦)</Label>
                  <Input
                    id="referralReward"
                    type="number"
                    value={platformSettings.referralRewardAmount}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        referralRewardAmount: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="businessReward">
                    Business Rec. Reward (₦)
                  </Label>
                  <Input
                    id="businessReward"
                    type="number"
                    value={platformSettings.businessRecommendationRewardAmount}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        businessRecommendationRewardAmount:
                          parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <div>
                  <Label htmlFor="minBusinessesForAgent">
                    Min. Businesses for Agent
                  </Label>
                  <Input
                    id="minBusinessesForAgent"
                    type="number"
                    min="1"
                    value={platformSettings.minimumBusinessesForAgent}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        minimumBusinessesForAgent:
                          parseInt(e.target.value) || 1,
                      })
                    }
                    className={
                      platformSettings.minimumBusinessesForAgent < 1
                        ? "border-red-500"
                        : ""
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum unique businesses a user must review to apply as an
                    agent
                  </p>
                  {platformSettings.minimumBusinessesForAgent < 1 && (
                    <p className="text-xs text-red-500 mt-1">
                      Value must be at least 1
                    </p>
                  )}
                </div>
              </div>

              {/* Agent Eligibility Info */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">
                  Agent Eligibility System
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    • Users must review <strong>different businesses</strong>,
                    not just multiple reviews
                  </p>
                  <p>
                    • This ensures agents have experience with various business
                    types
                  </p>
                  <p>
                    • Current requirement:{" "}
                    <strong>
                      {platformSettings.minimumBusinessesForAgent} unique
                      businesses
                    </strong>
                  </p>
                  <p>
                    • Changes only affect new applications, not existing agents
                  </p>
                </div>
              </div>

              {/* Impact Warning */}
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-900 mb-2">
                  ⚠️ Setting Impact
                </h4>
                <div className="text-sm text-amber-800 space-y-1">
                  <p>
                    • <strong>Increasing</strong> this number makes it harder
                    for users to become agents
                  </p>
                  <p>
                    • <strong>Decreasing</strong> this number makes it easier
                    for users to become agents
                  </p>
                  <p>
                    • Changes only affect{" "}
                    <strong>new agent applications</strong>
                  </p>
                  <p>• Existing agents and their privileges remain unchanged</p>
                  <p>
                    • Consider the balance between quality and accessibility
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowSettingsConfirmation(true)}
                  disabled={
                    saving || platformSettings.minimumBusinessesForAgent < 1
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Platform Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Account Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <p className="text-gray-900 dark:text-white">{profile.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </Label>
              <Badge variant="default">{profile.role}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Member Since
              </Label>
              <p className="text-gray-900 dark:text-white">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Login
              </Label>
              <p className="text-gray-900 dark:text-white">
                {profile.lastLoginAt
                  ? new Date(profile.lastLoginAt).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Settings Confirmation Dialog */}
      {showSettingsConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Platform Settings Update
            </h3>
            <div className="text-sm text-gray-600 mb-6 space-y-2">
              <p>You are about to update the following platform settings:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Minimum redemption amount: ₦
                  {platformSettings.minimumRedemptionAmount}
                </li>
                <li>Review reward: ₦{platformSettings.reviewRewardAmount}</li>
                <li>
                  Referral reward: ₦{platformSettings.referralRewardAmount}
                </li>
                <li>
                  Business recommendation reward: ₦
                  {platformSettings.businessRecommendationRewardAmount}
                </li>
                <li>
                  Minimum businesses for agent:{" "}
                  {platformSettings.minimumBusinessesForAgent}
                </li>
              </ul>
              <p className="text-amber-600 font-medium mt-3">
                ⚠️ These changes will affect new activities but not existing
                rewards or data.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSettingsConfirmation(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowSettingsConfirmation(false);
                  handlePlatformSettingsUpdate();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Confirm & Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
