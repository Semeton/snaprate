"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  MapPin,
  Filter,
  FileText,
  Trash2,
} from "lucide-react";

interface AgentApplication {
  id: string;
  status: "PENDING" | "ID_VERIFIED" | "APPROVED" | "REJECTED";
  reason: string;
  experience: string;
  motivation: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  idDocumentImage?: string;
  idVerified: boolean;
  idVerifiedAt?: string;
  idVerifiedBy?: string;
  registeredBusinessesCount: number;
  verifiedBusinessesCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    city: string;
    state: string;
    referralCode: string;
  };
}

export default function AdminAgentsPage() {
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<AgentApplication | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [applicationToDelete, setApplicationToDelete] =
    useState<AgentApplication | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/agents");
      if (response.ok) {
        const data = await response.json();
        setApplications(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIDVerification = async (
    applicationId: string,
    action: "APPROVE" | "REJECT",
  ) => {
    if (action === "REJECT" && !approvalNotes.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide notes for ID rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/verify-agent-id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          action,
          adminNotes: approvalNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `ID verification ${action.toLowerCase()}d successfully`,
        });

        fetchApplications();
        setShowDetails(false);
        setSelectedApplication(null);
        setApprovalNotes("");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process ID verification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to process ID verification:", error);
      toast({
        title: "Error",
        description: "Failed to process ID verification",
        variant: "destructive",
      });
    }
  };

  const handleApproval = async (
    applicationId: string,
    action: "APPROVED" | "REJECTED",
  ) => {
    if (action === "REJECTED" && !approvalNotes.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide notes for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/approve-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          action,
          notes: approvalNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Application ${action.toLowerCase()} successfully`,
        });

        // If this was an approval, show session update message
        if (action === "APPROVED" && data.requiresSessionUpdate) {
          toast({
            title: "Important",
            description:
              "The user's role has been updated. They may need to refresh their page to see the changes.",
            variant: "default",
          });
        }

        fetchApplications();
        setShowDetails(false);
        setSelectedApplication(null);
        setApprovalNotes("");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to process application:", error);
      toast({
        title: "Error",
        description: "Failed to process application",
        variant: "destructive",
      });
    }
  };

  const handleRevokeAgent = async (userId: string, userName: string) => {
    if (!approvalNotes.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide notes for revocation",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/approve-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "REVOKE",
          userId,
          notes: approvalNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Agent status revoked successfully. ${userName} is now a reviewer again.`,
        });

        // Show session update message
        if (data.requiresSessionUpdate) {
          toast({
            title: "Important",
            description:
              "The user's role has been updated. They may need to refresh their page to see the changes.",
            variant: "default",
          });
        }

        fetchApplications();
        setShowDetails(false);
        setSelectedApplication(null);
        setApprovalNotes("");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to revoke agent status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to revoke agent status:", error);
      toast({
        title: "Error",
        description: "Failed to revoke agent status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    try {
      const response = await fetch(
        `/api/admin/agent-applications/${applicationId}/delete`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Application deleted permanently",
        });
        fetchApplications();
        setShowDeleteConfirm(false);
        setApplicationToDelete(null);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete application",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete application:", error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (application: AgentApplication) => {
    setApplicationToDelete(application);
    setShowDeleteConfirm(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending ID Verification
          </Badge>
        );
      case "ID_VERIFIED":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            ID Verified - Awaiting Business Registration
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved Agent
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter((application) => {
    const matchesFilter = filter === "ALL" || application.status === filter;
    const matchesSearch =
      application.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.user.city.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = applications.filter(
    (a) => a.status === "PENDING",
  ).length;
  const approvedCount = applications.filter(
    (a) => a.status === "APPROVED",
  ).length;
  const rejectedCount = applications.filter(
    (a) => a.status === "REJECTED",
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
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
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Agent Applications
              </h1>
              <p className="text-gray-600">
                Review and approve agent applications
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-900">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">
                {pendingCount}
              </div>
              <p className="text-yellow-700">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-900">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {approvedCount}
              </div>
              <p className="text-green-700">Active agents</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-900">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">
                {rejectedCount}
              </div>
              <p className="text-red-700">Declined applications</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search applicants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="filter">Status Filter</Label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">
                      Pending ID Verification
                    </SelectItem>
                    <SelectItem value="ID_VERIFIED">ID Verified</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilter("ALL");
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>Applications ({filteredApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredApplications.length > 0 ? (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <div
                    key={application.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Shield className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {application.user.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {application.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(application.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {application.user.city}, {application.user.state}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Ref: {application.user.referralCode}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Experience: {application.experience}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(application.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {application.status === "PENDING" && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() =>
                            handleIDVerification(application.id, "APPROVE")
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify ID
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleIDVerification(application.id, "REJECT")
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject ID
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => confirmDelete(application)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}

                    {application.status === "ID_VERIFIED" && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            handleApproval(application.id, "APPROVED")
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve Agent
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleApproval(application.id, "REJECTED")
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {/* Show revoke button for approved applications */}
                    {application.status === "APPROVED" && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowDetails(true);
                            setApprovalNotes("");
                          }}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Revoke Agent Status
                        </Button>
                      </div>
                    )}

                    {/* Show delete button for rejected applications as well */}
                    {application.status === "REJECTED" && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => confirmDelete(application)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">
                  No applications found
                </p>
                <p className="text-sm">
                  {searchTerm || filter !== "ALL"
                    ? "Try adjusting your search or filters"
                    : "No agent applications have been submitted yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Application Details Modal */}
      {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Application Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedApplication(null);
                    setApprovalNotes("");
                  }}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Applicant Name
                    </Label>
                    <p className="text-gray-900">
                      {selectedApplication.user.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedApplication.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <p className="text-gray-900">
                      {selectedApplication.user.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Location
                    </Label>
                    <p className="text-gray-900">
                      {selectedApplication.user.city},{" "}
                      {selectedApplication.user.state}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Referral Code
                  </Label>
                  <p className="text-gray-900">
                    {selectedApplication.user.referralCode}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Experience
                  </Label>
                  <p className="text-gray-900">
                    {selectedApplication.experience}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Motivation
                  </Label>
                  <p className="text-gray-900">
                    {selectedApplication.motivation}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Reason for Applying
                  </Label>
                  <p className="text-gray-900">{selectedApplication.reason}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Application Date
                  </Label>
                  <p className="text-gray-900">
                    {new Date(
                      selectedApplication.createdAt,
                    ).toLocaleDateString()}
                  </p>
                </div>

                {/* ID Verification Details */}
                {selectedApplication.idDocumentType && (
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-3">
                      ID Verification Details
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          ID Document Type
                        </Label>
                        <p className="text-gray-900">
                          {selectedApplication.idDocumentType?.replace(
                            /_/g,
                            " ",
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          ID Document Number
                        </Label>
                        <p className="text-gray-900">
                          {selectedApplication.idDocumentNumber}
                        </p>
                      </div>
                    </div>

                    {selectedApplication.idDocumentImage && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-gray-700">
                          ID Document Image
                        </Label>
                        <div className="mt-2">
                          <Image
                            src={selectedApplication.idDocumentImage}
                            alt="ID Document"
                            width={300}
                            height={200}
                            className="rounded-lg border"
                          />
                        </div>
                      </div>
                    )}

                    {selectedApplication.idVerified && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            ID Verified
                          </span>
                        </div>
                        {selectedApplication.idVerifiedAt && (
                          <p className="text-xs text-green-700 mt-1">
                            Verified on:{" "}
                            {new Date(
                              selectedApplication.idVerifiedAt,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Business Registration Progress */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold mb-3">
                    Business Registration Progress
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">
                        {selectedApplication.registeredBusinessesCount}
                      </div>
                      <p className="text-sm text-blue-700">
                        Registered Businesses
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">
                        {selectedApplication.verifiedBusinessesCount}
                      </div>
                      <p className="text-sm text-green-700">
                        Verified Businesses
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm text-gray-600">
                      <strong>Requirements:</strong> 2 verified businesses
                      needed for auto-approval
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (selectedApplication.verifiedBusinessesCount / 2) *
                              100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedApplication.verifiedBusinessesCount}/2 verified
                      businesses
                    </div>
                  </div>
                </div>

                {selectedApplication.status === "PENDING" && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-700">
                      Admin Notes (Required for rejection)
                    </Label>
                    <Textarea
                      placeholder="Enter your notes..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />

                    <div className="flex items-center space-x-3 pt-4">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() =>
                          handleIDVerification(
                            selectedApplication.id,
                            "APPROVE",
                          )
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify ID
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleIDVerification(selectedApplication.id, "REJECT")
                        }
                        disabled={!approvalNotes.trim()}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject ID
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => confirmDelete(selectedApplication)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Application
                      </Button>
                    </div>
                  </div>
                )}

                {/* Show approval functionality for ID verified applications */}
                {selectedApplication.status === "ID_VERIFIED" && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-700">
                      Admin Notes (Required for rejection)
                    </Label>
                    <Textarea
                      placeholder="Enter your notes..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />

                    <div className="flex items-center space-x-3 pt-4">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          handleApproval(selectedApplication.id, "APPROVED")
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Agent
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleApproval(selectedApplication.id, "REJECTED")
                        }
                        disabled={!approvalNotes.trim()}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>
                  </div>
                )}

                {/* Show revoke functionality for approved applications */}
                {selectedApplication.status === "APPROVED" && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-700">
                      Admin Notes (Required for revocation)
                    </Label>
                    <Textarea
                      placeholder="Enter reason for revoking agent status..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />

                    <div className="flex items-center space-x-3 pt-4">
                      <Button
                        variant="outline"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() =>
                          handleRevokeAgent(
                            selectedApplication.user.id,
                            selectedApplication.user.name,
                          )
                        }
                        disabled={!approvalNotes.trim()}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Revoke Agent Status
                      </Button>
                    </div>
                  </div>
                )}

                {/* Show delete button for rejected applications in modal */}
                {selectedApplication.status === "REJECTED" && (
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => confirmDelete(selectedApplication)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Application
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && applicationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Application
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to permanently delete the application from{" "}
                <span className="font-medium text-gray-900">
                  {applicationToDelete.user.name}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setApplicationToDelete(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    handleDeleteApplication(applicationToDelete.id)
                  }
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
