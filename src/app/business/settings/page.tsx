"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole } from "@/types";
import {
  Settings,
  User,
  Key,
  Trash2,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  address: string;
}

export default function BusinessSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
      <BusinessSettingsContent />
    </ProtectedRoute>
  );
}

function BusinessSettingsContent() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Account deletion states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Message states
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // First try to get basic user info from session
        if (session?.user) {
          setProfile({
            name: session.user.name || "",
            email: session.user.email || "",
            phone: "", // Will be fetched from user profile
            state: "", // Will be fetched from user profile
            city: "", // Will be fetched from user profile
            address: "", // Will be fetched from user profile
          });
        }

        // Fetch full user profile data from the database
        const response = await fetch("/api/user/profile");

        if (response.ok) {
          const profileData = await response.json();
          setProfile((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              phone: profileData.phone || "",
              state: profileData.state || "",
              city: profileData.city || "",
              address: profileData.address || "",
            };
          });
        } else if (response.status === 404) {
          // Profile not found, keep basic info from session
          console.log("User profile not found, using session data only");
        } else {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setMessage({
          type: "error",
          text: "Failed to load profile information",
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const handleProfileUpdate = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`);
      }

      setMessage({
        type: "success",
        text: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage({
        type: "error",
        text: "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "New passwords don't match",
      });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters long",
      });
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to change password: ${response.statusText}`);
      }

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage({
        type: "success",
        text: "Password changed successfully",
      });
    } catch (error) {
      console.error("Failed to change password:", error);
      setMessage({
        type: "error",
        text: "Failed to change password. Please check your current password.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!deletePassword) {
      setMessage({
        type: "error",
        text: "Please enter your password to confirm deletion",
      });
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: deletePassword,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete account: ${response.statusText}`);
      }

      // Sign out and redirect
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Failed to delete account:", error);
      setMessage({
        type: "error",
        text: "Failed to delete account. Please check your password.",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading settings...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Profile Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Unable to load profile information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Account Settings
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your profile, password, and account
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message && (
          <Alert
            className={`mb-6 ${
              message.type === "success"
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : message.type === "error"
                ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : message.type === "error" ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <AlertDescription
                  className={
                    message.type === "success"
                      ? "text-green-800 dark:text-green-200"
                      : message.type === "error"
                      ? "text-red-800 dark:text-red-200"
                      : "text-yellow-800 dark:text-yellow-200"
                  }
                >
                  {message.text}
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessage(null)}
                className="h-6 w-6 p-0 hover:bg-transparent"
              >
                ×
              </Button>
            </div>
          </Alert>
        )}

        <div className="space-y-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-500" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) =>
                      setProfile({ ...profile, state: e.target.value })
                    }
                    placeholder="Enter your state"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile({ ...profile, city: e.target.value })
                    }
                    placeholder="Enter your city"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleProfileUpdate} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2 text-green-500" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Deletion */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  This action cannot be undone. This will permanently delete
                  your account and all associated data.
                </AlertDescription>
              </Alert>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full md:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deletePassword">
                      Enter your password to confirm deletion
                    </Label>
                    <Input
                      id="deletePassword"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="mt-2"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="destructive"
                      onClick={handleAccountDeletion}
                      disabled={deleting || !deletePassword}
                      className="flex-1 md:flex-none"
                    >
                      {deleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Confirm Deletion
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword("");
                      }}
                      className="flex-1 md:flex-none"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
