"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import {
  Shield,
  Users,
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Crown,
} from "lucide-react";

interface AdminPermissions {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  permissions: {
    canModerateReviews: boolean;
    canModerateBusinesses: boolean;
    canModerateUsers: boolean;
    canModerateContent: boolean;
    canManageAgents: boolean;
    canViewAnalytics: boolean;
    canManageSettings: boolean;
    canInviteAdmins: boolean;
  };
  isActive: boolean;
  lastActive: string;
  recentActions?: Array<{
    action: string;
    createdAt: string;
  }>;
}

interface ContentModerationSettings {
  autoFlagKeywords: string[];
  autoFlagThreshold: number;
  requireReviewForNewUsers: boolean;
  requireReviewForNewBusinesses: boolean;
  requireReviewForReviews: boolean;
  maxReportsBeforeAutoFlag: number;
  moderationQueueSize: number;
}

export default function ContentModerationPage() {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState<AdminPermissions[]>([]);
  const [moderationSettings, setModerationSettings] =
    useState<ContentModerationSettings>({
      autoFlagKeywords: ["spam", "inappropriate", "offensive"],
      autoFlagThreshold: 3,
      requireReviewForNewUsers: true,
      requireReviewForNewBusinesses: true,
      requireReviewForReviews: false,
      maxReportsBeforeAutoFlag: 5,
      moderationQueueSize: 100,
    });
  const [loading, setLoading] = useState(true);
  const [editingAdmin, setEditingAdmin] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    if (session?.user?.role === "SUPER_ADMIN") {
      fetchAdmins();
      fetchModerationSettings();
    }
  }, [session]);

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/moderation/admins");
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModerationSettings = async () => {
    try {
      const response = await fetch("/api/admin/moderation/settings");
      if (response.ok) {
        const data = await response.json();
        setModerationSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch moderation settings:", error);
    }
  };

  const updateAdminPermissions = async (
    adminId: string,
    permissions: AdminPermissions["permissions"],
  ) => {
    try {
      const response = await fetch(
        `/api/admin/moderation/admins/${adminId}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ permissions }),
        },
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Admin permissions updated successfully",
        });
        setEditingAdmin(null);
        fetchAdmins();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  const saveModerationSettings = async () => {
    try {
      const response = await fetch("/api/admin/moderation/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(moderationSettings),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Moderation settings saved successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const addKeyword = () => {
    if (
      newKeyword.trim() &&
      !moderationSettings.autoFlagKeywords.includes(newKeyword.trim())
    ) {
      setModerationSettings({
        ...moderationSettings,
        autoFlagKeywords: [
          ...moderationSettings.autoFlagKeywords,
          newKeyword.trim(),
        ],
      });
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setModerationSettings({
      ...moderationSettings,
      autoFlagKeywords: moderationSettings.autoFlagKeywords.filter(
        (k) => k !== keyword,
      ),
    });
  };

  const handlePermissionChange = (
    adminId: string,
    permission: keyof AdminPermissions["permissions"],
    checked: boolean,
  ) => {
    const admin = admins.find((a) => a.id === adminId);
    if (admin) {
      const updatedPermissions = {
        ...admin.permissions,
        [permission]: checked,
      };
      updateAdminPermissions(adminId, updatedPermissions);
    }
  };

  const getRoleIcon = (role: string) => {
    return role === "SUPER_ADMIN" ? (
      <Crown className="h-4 w-4 text-yellow-600" />
    ) : (
      <Shield className="h-4 w-4 text-blue-600" />
    );
  };

  if (session?.user?.role !== "SUPER_ADMIN") {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Only Super Admins can access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading moderation settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Content Moderation
          </h1>
          <p className="text-gray-600 mt-2">
            Manage admin permissions and content moderation settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Admin Permissions Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Admin Permissions Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {admins.map((admin) => (
              <div key={admin.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getRoleIcon(admin.role)}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {admin.name}
                      </h3>
                      <p className="text-sm text-gray-500">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        admin.role === "SUPER_ADMIN" ? "destructive" : "default"
                      }
                    >
                      {admin.role}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Last active:{" "}
                      {new Date(admin.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {admin.role === "ADMIN" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${admin.id}-reviews`}
                        checked={admin.permissions.canModerateReviews}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(
                            admin.id,
                            "canModerateReviews",
                            checked as boolean,
                          )
                        }
                      />
                      <Label
                        htmlFor={`${admin.id}-reviews`}
                        className="text-sm"
                      >
                        Moderate Reviews
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${admin.id}-businesses`}
                        checked={admin.permissions.canModerateBusinesses}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(
                            admin.id,
                            "canModerateBusinesses",
                            checked as boolean,
                          )
                        }
                      />
                      <Label
                        htmlFor={`${admin.id}-businesses`}
                        className="text-sm"
                      >
                        Moderate Businesses
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${admin.id}-users`}
                        checked={admin.permissions.canModerateUsers}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(
                            admin.id,
                            "canModerateUsers",
                            checked as boolean,
                          )
                        }
                      />
                      <Label htmlFor={`${admin.id}-users`} className="text-sm">
                        Moderate Users
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${admin.id}-content`}
                        checked={admin.permissions.canModerateContent}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(
                            admin.id,
                            "canModerateContent",
                            checked as boolean,
                          )
                        }
                      />
                      <Label
                        htmlFor={`${admin.id}-content`}
                        className="text-sm"
                      >
                        Moderate Content
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${admin.id}-agents`}
                        checked={admin.permissions.canManageAgents}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(
                            admin.id,
                            "canManageAgents",
                            checked as boolean,
                          )
                        }
                      />
                      <Label htmlFor={`${admin.id}-agents`} className="text-sm">
                        Manage Agents
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${admin.id}-analytics`}
                        checked={admin.permissions.canViewAnalytics}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(
                            admin.id,
                            "canViewAnalytics",
                            checked as boolean,
                          )
                        }
                      />
                      <Label
                        htmlFor={`${admin.id}-analytics`}
                        className="text-sm"
                      >
                        View Analytics
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${admin.id}-settings`}
                        checked={admin.permissions.canManageSettings}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(
                            admin.id,
                            "canManageSettings",
                            checked as boolean,
                          )
                        }
                      />
                      <Label
                        htmlFor={`${admin.id}-settings`}
                        className="text-sm"
                      >
                        Manage Settings
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${admin.id}-invite`}
                        checked={admin.permissions.canInviteAdmins}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(
                            admin.id,
                            "canInviteAdmins",
                            checked as boolean,
                          )
                        }
                      />
                      <Label htmlFor={`${admin.id}-invite`} className="text-sm">
                        Invite Admins
                      </Label>
                    </div>
                  </div>
                )}

                {admin.role === "SUPER_ADMIN" && (
                  <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                    <strong>Super Admin:</strong> Has all permissions by default
                    and cannot be modified.
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Moderation Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Content Moderation Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-Flag Keywords */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Auto-Flag Keywords
            </Label>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Add keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                className="flex-1"
              />
              <Button onClick={addKeyword} size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {moderationSettings.autoFlagKeywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>{keyword}</span>
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:text-red-600"
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Thresholds and Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Auto-Flag Threshold
              </Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={moderationSettings.autoFlagThreshold}
                onChange={(e) =>
                  setModerationSettings({
                    ...moderationSettings,
                    autoFlagThreshold: parseInt(e.target.value) || 1,
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of reports before content is automatically flagged
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Max Reports Before Auto-Flag
              </Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={moderationSettings.maxReportsBeforeAutoFlag}
                onChange={(e) =>
                  setModerationSettings({
                    ...moderationSettings,
                    maxReportsBeforeAutoFlag: parseInt(e.target.value) || 1,
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum reports before content is automatically flagged
              </p>
            </div>
          </div>

          {/* Review Requirements */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-4 block">
              Review Requirements
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Require Review for New Users
                  </Label>
                  <p className="text-xs text-gray-500">
                    All new user registrations require admin approval
                  </p>
                </div>
                <Checkbox
                  checked={moderationSettings.requireReviewForNewUsers}
                  onCheckedChange={(checked) =>
                    setModerationSettings({
                      ...moderationSettings,
                      requireReviewForNewUsers: checked as boolean,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Require Review for New Businesses
                  </Label>
                  <p className="text-xs text-gray-500">
                    All new business registrations require admin approval
                  </p>
                </div>
                <Checkbox
                  checked={moderationSettings.requireReviewForNewBusinesses}
                  onCheckedChange={(checked) =>
                    setModerationSettings({
                      ...moderationSettings,
                      requireReviewForNewBusinesses: checked as boolean,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Require Review for Reviews
                  </Label>
                  <p className="text-xs text-gray-500">
                    All new reviews require admin approval
                  </p>
                </div>
                <Checkbox
                  checked={moderationSettings.requireReviewForReviews}
                  onCheckedChange={(checked) =>
                    setModerationSettings({
                      ...moderationSettings,
                      requireReviewForReviews: checked as boolean,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveModerationSettings}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Pending Reviews</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-sm text-gray-600">Flagged Content</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Resolved Reports</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {admins.length}
              </div>
              <div className="text-sm text-gray-600">Active Admins</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
