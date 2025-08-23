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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Camera,
} from "lucide-react";
import { State } from "@/types";
import ReviewerSidebar from "@/components/ReviewerSidebar";

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
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    state: "",
    city: "",
    address: "",
    dateOfBirth: "",
    gender: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchProfileData();
    }
  }, [session, status]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData.data);

        // Populate form with current data
        setProfileForm({
          name: profileData.data.name || "",
          phone: profileData.data.phone || "",
          state: profileData.data.state || "",
          city: profileData.data.city || "",
          address: profileData.data.address || "",
          dateOfBirth: profileData.data.dateOfBirth
            ? profileData.data.dateOfBirth.split("T")[0]
            : "",
          gender: profileData.data.gender || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setSaving(true);
      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSuccess("Avatar updated successfully");
        fetchProfileData(); // Refresh profile data
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update avatar");
      }
    } catch (error) {
      setError("Failed to update avatar");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        // Refresh profile data
        fetchProfileData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      setError("An error occurred while updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      setSaving(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setSuccess("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to change password");
      }
    } catch (error) {
      setError("An error occurred while changing password");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      setError("Please type DELETE to confirm account deletion");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: passwordForm.currentPassword,
        }),
      });

      if (response.ok) {
        setSuccess(
          "Account deleted successfully. You will be redirected to the home page.",
        );
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete account");
      }
    } catch (error) {
      setError("An error occurred while deleting account");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading settings...
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <ReviewerSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Settings
            </h1>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Account Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your profile, password, and account preferences
            </p>
          </div>

          <div className="max-w-4xl">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="danger">Danger Zone</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Profile Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      {/* Avatar Upload */}
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                            {profile?.avatar ? (
                              <img
                                src={profile.avatar}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="h-10 w-10 text-gray-400 dark:text-gray-300" />
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
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Profile Picture
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Click to upload new image
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium">
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            value={profileForm.name}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            className="mt-1"
                            required
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="phone"
                            className="text-sm font-medium"
                          >
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            className="mt-1"
                            placeholder="+234..."
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="state"
                            className="text-sm font-medium"
                          >
                            State *
                          </Label>
                          <Select
                            value={profileForm.state}
                            onValueChange={(value) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                state: value,
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(State).map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="city" className="text-sm font-medium">
                            City *
                          </Label>
                          <Input
                            id="city"
                            value={profileForm.city}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                            className="mt-1"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label
                            htmlFor="address"
                            className="text-sm font-medium"
                          >
                            Address *
                          </Label>
                          <Input
                            id="address"
                            value={profileForm.address}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            className="mt-1"
                            required
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="dateOfBirth"
                            className="text-sm font-medium"
                          >
                            Date of Birth
                          </Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={profileForm.dateOfBirth}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                dateOfBirth: e.target.value,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="gender"
                            className="text-sm font-medium"
                          >
                            Gender
                          </Label>
                          <Select
                            value={profileForm.gender}
                            onValueChange={(value) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                gender: value,
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">
                                Prefer not to say
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={saving}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Password Tab */}
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lock className="h-5 w-5" />
                      <span>Change Password</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div>
                        <Label
                          htmlFor="currentPassword"
                          className="text-sm font-medium"
                        >
                          Current Password *
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="newPassword"
                          className="text-sm font-medium"
                        >
                          New Password *
                        </Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          className="mt-1"
                          required
                          minLength={8}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Password must be at least 8 characters long
                        </p>
                      </div>

                      <div>
                        <Label
                          htmlFor="confirmPassword"
                          className="text-sm font-medium"
                        >
                          Confirm New Password *
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          className="mt-1"
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {saving ? "Changing..." : "Change Password"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Danger Zone Tab */}
              <TabsContent value="danger">
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Danger Zone</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-red-800">
                            Delete Account
                          </h3>
                          <p className="text-sm text-red-700 mt-1">
                            This action cannot be undone. This will permanently
                            delete your account and remove all your data from
                            our servers.
                          </p>
                        </div>
                      </div>
                    </div>

                    {!showDeleteWarning ? (
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteWarning(true)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete My Account
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label
                            htmlFor="deleteConfirm"
                            className="text-sm font-medium text-red-700"
                          >
                            Type DELETE to confirm
                          </Label>
                          <Input
                            id="deleteConfirm"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            className="mt-1 border-red-300"
                            placeholder="DELETE"
                          />
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={saving || deleteConfirm !== "DELETE"}
                            className="flex-1"
                          >
                            {saving
                              ? "Deleting..."
                              : "Permanently Delete Account"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDeleteWarning(false);
                              setDeleteConfirm("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Error and Success Messages */}
            {error && (
              <Alert className="border-red-500 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50">
                <AlertDescription className="text-green-700 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{success}</span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
