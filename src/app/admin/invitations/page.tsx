"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  UserPlus,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface AdminInvitation {
  id: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  invitationToken: string;
  invitedByUser: {
    name: string;
    email: string;
  };
}

export default function AdminInvitationsPage() {
  const { data: session } = useSession();
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "ADMIN",
  });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/invite");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invitations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingInvitation(true);
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Invitation sent to ${formData.email}`,
        });
        setFormData({ email: "", role: "ADMIN" });
        fetchInvitations(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send invitation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to send invitation:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setSendingInvitation(false);
    }
  };

  const copyInvitationLink = (invitation: AdminInvitation) => {
    const link = `${window.location.origin}/admin/accept-invitation?token=${invitation.invitationToken}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Invitation link copied to clipboard",
    });
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/invite/${invitationId}/cancel`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Invitation cancelled successfully",
        });
        fetchInvitations(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to cancel invitation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    return (
      <Badge
        variant="outline"
        className={
          role === "SUPER_ADMIN"
            ? "border-purple-300 text-purple-700"
            : "border-blue-300 text-blue-700"
        }
      >
        {role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <UserPlus className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Invitations
              </h1>
              <p className="text-gray-600">
                Invite new administrators to the platform
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invitation Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Send Invitation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendInvitation} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Admin Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: "ADMIN" | "SUPER_ADMIN") =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sendingInvitation}
                  >
                    {sendingInvitation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Invitation Process:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• Invitation expires in 24 hours</li>
                        <li>• Recipient receives email with secure link</li>
                        <li>• New admin sets password upon acceptance</li>
                        <li>• Account activated immediately</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invitations List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Invitation History</span>
                  <Badge variant="outline">{invitations.length} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invitations.length > 0 ? (
                  <div className="space-y-4">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className={`p-4 border rounded-lg ${
                          invitation.status === "EXPIRED" ||
                          isExpired(invitation.expiresAt)
                            ? "bg-gray-50 border-gray-200"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-full">
                              <Mail className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {invitation.email}
                              </p>
                              <p className="text-sm text-gray-500">
                                Invited by {invitation.invitedByUser.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getRoleBadge(invitation.role)}
                            {getStatusBadge(invitation.status)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span>
                            Created: {formatDate(invitation.createdAt)}
                          </span>
                          <span>
                            Expires: {formatDate(invitation.expiresAt)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {invitation.status === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyInvitationLink(invitation)}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Link
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                onClick={() => cancelInvitation(invitation.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {invitation.status === "ACCEPTED" && (
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Account Created
                            </Badge>
                          )}
                          {(invitation.status === "EXPIRED" ||
                            isExpired(invitation.expiresAt)) && (
                            <Badge variant="outline" className="text-gray-500">
                              Expired
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">
                      No invitations yet
                    </p>
                    <p className="text-sm">
                      Send your first admin invitation using the form on the
                      left
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
