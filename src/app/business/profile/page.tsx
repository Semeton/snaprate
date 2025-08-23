"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import BusinessImageUpload from "@/components/BusinessImageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole, State, BusinessCategory } from "@/types";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Camera,
  Save,
  Edit,
  Shield,
  Calendar,
  Users,
  Star,
  Eye,
  RefreshCw,
} from "lucide-react";

interface BusinessProfile {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: State;
  logo?: string;
  coverImage?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verificationDocuments: string[];
  averageRating: number;
  totalReviews: number;
  totalVisits: number;
  createdAt: string;
  updatedAt: string;
}

export default function BusinessProfilePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
      <BusinessProfileContent />
    </ProtectedRoute>
  );
}

function BusinessProfileContent() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: BusinessCategory.RESTAURANT,
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: State.LAGOS,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/business");

        if (!response.ok) {
          if (response.status === 404) {
            // No business found - redirect to registration
            window.location.href = "/business/register";
            return;
          }
          throw new Error("Failed to fetch business profile");
        }

        const data = await response.json();
        const businessData = data.business;

        // Transform the data to match our interface
        const businessProfile: BusinessProfile = {
          id: businessData.id,
          name: businessData.name,
          description: businessData.description || "",
          category: businessData.category,
          phone: businessData.phone,
          email: businessData.email,
          website: businessData.website,
          address: businessData.address,
          city: businessData.city,
          state: businessData.state,
          logo: businessData.logo,
          coverImage: businessData.coverImage,
          verificationStatus: businessData.verificationStatus || "PENDING",
          verificationDocuments: businessData.verificationDocuments || [],
          averageRating: businessData.averageRating || 0,
          totalReviews: businessData.totalReviews || 0,
          totalVisits: businessData.totalVisits || 0,
          createdAt: businessData.createdAt,
          updatedAt: businessData.updatedAt,
        };

        setProfile(businessProfile);
        setFormData({
          name: businessProfile.name,
          description: businessProfile.description,
          category: businessProfile.category,
          phone: businessProfile.phone,
          email: businessProfile.email,
          website: businessProfile.website || "",
          address: businessProfile.address,
          city: businessProfile.city,
          state: businessProfile.state,
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === "category"
          ? (value as BusinessCategory)
          : field === "state"
          ? (value as State)
          : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Log the data being sent for debugging
      console.log("Sending business update data:", formData);

      const response = await fetch("/api/business/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.details ||
          errorData.error ||
          "Failed to update business profile";
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Update local state with the updated business data
      if (profile) {
        setProfile({
          ...profile,
          ...formData,
          updatedAt: new Date().toISOString(),
        });
      }

      setMessage({
        type: "success",
        text: "Business profile updated successfully!",
      });
      setIsEditing(false);
      setSaving(false);

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to update profile",
      });
      setSaving(false);

      // Clear error message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (profile) {
      setFormData({
        name: profile.name,
        description: profile.description,
        category: profile.category,
        phone: profile.phone,
        email: profile.email,
        website: profile.website || "",
        address: profile.address,
        city: profile.city,
        state: profile.state,
      });
    }
    setIsEditing(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/business");

      if (!response.ok) {
        throw new Error("Failed to refresh business profile");
      }

      const data = await response.json();
      const businessData = data.business;

      // Transform the data to match our interface
      const businessProfile: BusinessProfile = {
        id: businessData.id,
        name: businessData.name,
        description: businessData.description || "",
        category: businessData.category,
        phone: businessData.phone,
        email: businessData.email,
        website: businessData.website,
        address: businessData.address,
        city: businessData.city,
        state: businessData.state,
        logo: businessData.logo,
        coverImage: businessData.coverImage,
        verificationStatus: businessData.verificationStatus || "PENDING",
        verificationDocuments: businessData.verificationDocuments || [],
        averageRating: businessData.averageRating || 0,
        totalReviews: businessData.totalReviews || 0,
        totalVisits: businessData.totalVisits || 0,
        createdAt: businessData.createdAt,
        updatedAt: businessData.updatedAt,
      };

      setProfile(businessProfile);
      setFormData({
        name: businessProfile.name,
        description: businessProfile.description,
        category: businessProfile.category,
        phone: businessProfile.phone,
        email: businessProfile.email,
        website: businessProfile.website || "",
        address: businessProfile.address,
        city: businessProfile.city,
        state: businessProfile.state,
      });

      setMessage({ type: "success", text: "Profile refreshed successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      setMessage({ type: "error", text: "Failed to refresh profile" });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading profile...
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
              No Business Profile Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to create a business profile first.
            </p>
            <Button>Create Business Profile</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Business Profile
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your business information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${
                        loading ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
                : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image and Logo */}
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                    {profile.coverImage ? (
                      <img
                        src={profile.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="text-white text-center">
                        <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="opacity-75">Add cover image</p>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-12 left-6">
                    <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-xl border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center">
                      {profile.logo ? (
                        <img
                          src={profile.logo}
                          alt="Logo"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Building2 className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-16 pb-6 px-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {profile.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {profile.category.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Badge
                      variant={
                        profile.verificationStatus === "VERIFIED"
                          ? "default"
                          : profile.verificationStatus === "PENDING"
                          ? "secondary"
                          : "destructive"
                      }
                      className="flex items-center space-x-1"
                    >
                      <Shield className="w-3 h-3" />
                      <span>{profile.verificationStatus}</span>
                    </Badge>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Business Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            handleInputChange(
                              "category",
                              value as BusinessCategory,
                            )
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(BusinessCategory).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      {/* Image Upload Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <BusinessImageUpload
                          businessId={profile.id}
                          currentImage={profile.logo}
                          imageType="logo"
                          onImageUpdate={(imageUrl) => {
                            setProfile((prev) =>
                              prev ? { ...prev, logo: imageUrl } : null,
                            );
                          }}
                        />

                        <BusinessImageUpload
                          businessId={profile.id}
                          currentImage={profile.coverImage}
                          imageType="coverImage"
                          onImageUpdate={(imageUrl) => {
                            setProfile((prev) =>
                              prev ? { ...prev, coverImage: imageUrl } : null,
                            );
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">
                      {profile.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) =>
                          handleInputChange("website", e.target.value)
                        }
                        className="mt-1"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {profile.phone}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {profile.email}
                      </span>
                    </div>

                    {profile.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) =>
                          handleInputChange("state", value)
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
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
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {profile.address}, {profile.city},{" "}
                      {profile.state.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Business Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Rating
                    </span>
                  </div>
                  <span className="font-semibold">
                    {profile.averageRating}/5
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Reviews
                    </span>
                  </div>
                  <span className="font-semibold">{profile.totalReviews}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Visits
                    </span>
                  </div>
                  <span className="font-semibold">
                    {profile.totalVisits.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Joined
                    </span>
                  </div>
                  <span className="font-semibold">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Verification Documents */}
            <Card className="hidden">
              <CardHeader>
                <CardTitle>Verification Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile.verificationDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {doc}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    Upload New Document
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="hidden">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Update Logo
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Update Cover
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Verification Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
