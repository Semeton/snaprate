"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Shield,
  Eye,
  Search,
} from "lucide-react";

interface BusinessRegistration {
  id: string;
  registrationType: "FULL_REGISTRATION" | "RECOMMENDATION";
  status: "PENDING" | "VERIFIED" | "REJECTED";
  businessName: string | null;
  businessDescription: string | null;
  businessCategory: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  businessCity: string | null;
  businessState: string | null;
  businessWebsite: string | null;
  directorIdType: string | null;
  directorIdNumber: string | null;
  directorIdImage: string | null;
  cacDocumentType: string | null;
  cacDocumentImage: string | null;
  firsTaxClearance: string | null;
  addressEvidenceType: string | null;
  addressEvidenceImage: string | null;
  submittedAt: string;
  verifiedAt: string | null;
  adminNotes: string | null;
  agent: {
    id: string;
    name: string;
    email: string;
    userIdentifier: string | null;
  };
  business?: {
    id: string;
    name: string;
    isVerified: boolean;
    verificationSource: string;
  };
}

export default function BusinessRegistrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [registrations, setRegistrations] = useState<BusinessRegistration[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] =
    useState<BusinessRegistration | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      router.push("/dashboard");
      return;
    }

    fetchRegistrations();
  }, [session, status, router]);

  const fetchRegistrations = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.append("status", filterStatus);
      if (filterType !== "ALL") params.append("type", filterType);

      const response = await fetch(
        `/api/admin/business-registrations?${params}`,
      );
      const data = await response.json();

      if (data.success) {
        let filteredRegistrations = data.data.registrations;

        if (searchTerm) {
          filteredRegistrations = filteredRegistrations.filter(
            (reg: BusinessRegistration) =>
              reg.businessName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              reg.agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              reg.agent.email.toLowerCase().includes(searchTerm.toLowerCase()),
          );
        }

        setRegistrations(filteredRegistrations);
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch business registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filterStatus, filterType, searchTerm]);

  const handleProcessRegistration = async (action: "APPROVE" | "REJECT") => {
    if (!selectedRegistration) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/business-registrations/${selectedRegistration.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            adminNotes,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        setShowDetails(false);
        setAdminNotes("");
        fetchRegistrations();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing registration:", error);
      toast({
        title: "Error",
        description: "Failed to process registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openDetails = async (registrationId: string) => {
    try {
      const response = await fetch(
        `/api/admin/business-registrations/${registrationId}`,
      );
      const data = await response.json();

      if (data.success) {
        setSelectedRegistration(data.data);
        setShowDetails(true);
        setAdminNotes(data.data.adminNotes || "");
      }
    } catch (error) {
      console.error("Error fetching registration details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch registration details",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "VERIFIED":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "FULL_REGISTRATION" ? (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        <Building2 className="w-3 h-3 mr-1" />
        Full Registration
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-purple-50 text-purple-700 border-purple-200"
      >
        <FileText className="w-3 h-3 mr-1" />
        Recommendation
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading business registrations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Business Registrations
        </h1>
        <p className="text-gray-600">
          Review and approve full business registrations from agents (with
          verification documents)
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by business name, agent name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="FULL_REGISTRATION">
                    Full Registration
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations List */}
      <Card>
        <CardHeader>
          <CardTitle>Business Registrations ({registrations.length})</CardTitle>
          <CardDescription>
            Review and approve business registrations submitted by agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No registrations found
              </h3>
              <p className="text-gray-600">
                No business registrations match your current filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {registration.businessName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {registration.businessCategory?.replace(/_/g, " ")} •{" "}
                        {registration.businessCity},{" "}
                        {registration.businessState}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{registration.agent.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(
                              registration.submittedAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getTypeBadge(registration.registrationType)}
                      {getStatusBadge(registration.status)}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetails(registration.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Business Registration Details</DialogTitle>
            <DialogDescription>
              Review all submitted information and documents
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedRegistration.businessName}
                  </h2>
                  <p className="text-gray-600">
                    {selectedRegistration.businessCategory?.replace(/_/g, " ")}{" "}
                    • {selectedRegistration.businessCity},{" "}
                    {selectedRegistration.businessState}
                  </p>
                </div>
                <div className="flex gap-2">
                  {getTypeBadge(selectedRegistration.registrationType)}
                  {getStatusBadge(selectedRegistration.status)}
                </div>
              </div>

              {/* Agent Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">
                  Agent Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Agent Name</Label>
                    <p className="text-gray-900">
                      {selectedRegistration.agent.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-gray-900">
                      {selectedRegistration.agent.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">User ID</Label>
                    <p className="text-gray-900">
                      {selectedRegistration.agent.userIdentifier || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Submitted</Label>
                    <p className="text-gray-900">
                      {new Date(
                        selectedRegistration.submittedAt,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRegistration.businessDescription && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-gray-900">
                        {selectedRegistration.businessDescription}
                      </p>
                    </div>
                  )}
                  {selectedRegistration.businessPhone && (
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-gray-900">
                        {selectedRegistration.businessPhone}
                      </p>
                    </div>
                  )}
                  {selectedRegistration.businessEmail && (
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-gray-900">
                        {selectedRegistration.businessEmail}
                      </p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-gray-900">
                      {selectedRegistration.businessAddress}
                    </p>
                  </div>
                  {selectedRegistration.businessWebsite && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Website</Label>
                      <p className="text-gray-900">
                        <a
                          href={selectedRegistration.businessWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedRegistration.businessWebsite}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Documents - Only for Full Registration */}
              {selectedRegistration.registrationType ===
                "FULL_REGISTRATION" && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Verification Documents
                  </h3>

                  {/* Director ID */}
                  <div className="mb-4">
                    <h4 className="text-md font-medium mb-2">
                      Director/Authorized Signatory ID
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">ID Type</Label>
                        <p className="text-gray-900">
                          {selectedRegistration.directorIdType?.replace(
                            /_/g,
                            " ",
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">ID Number</Label>
                        <p className="text-gray-900">
                          {selectedRegistration.directorIdNumber}
                        </p>
                      </div>
                    </div>
                    {selectedRegistration.directorIdImage && (
                      <div className="mt-3">
                        <Label className="text-sm font-medium">
                          ID Document
                        </Label>
                        <div className="mt-2">
                          <img
                            src={selectedRegistration.directorIdImage}
                            alt="Director ID"
                            className="max-w-full h-auto rounded border"
                            style={{ maxHeight: "300px" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Business Documents */}
                  {(selectedRegistration.cacDocumentImage ||
                    selectedRegistration.firsTaxClearance) && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium mb-2">
                        Business Documents
                      </h4>
                      {selectedRegistration.cacDocumentType && (
                        <div className="mb-2">
                          <Label className="text-sm font-medium">
                            CAC Document Type
                          </Label>
                          <p className="text-gray-900">
                            {selectedRegistration.cacDocumentType.replace(
                              /_/g,
                              " ",
                            )}
                          </p>
                        </div>
                      )}
                      {selectedRegistration.cacDocumentImage && (
                        <div className="mt-3">
                          <Label className="text-sm font-medium">
                            CAC Document
                          </Label>
                          <div className="mt-2">
                            <img
                              src={selectedRegistration.cacDocumentImage}
                              alt="CAC Document"
                              className="max-w-full h-auto rounded border"
                              style={{ maxHeight: "300px" }}
                            />
                          </div>
                        </div>
                      )}
                      {selectedRegistration.firsTaxClearance && (
                        <div className="mt-3">
                          <Label className="text-sm font-medium">
                            FIRS Tax Clearance
                          </Label>
                          <div className="mt-2">
                            <img
                              src={selectedRegistration.firsTaxClearance}
                              alt="FIRS Tax Clearance"
                              className="max-w-full h-auto rounded border"
                              style={{ maxHeight: "300px" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address Verification */}
                  {selectedRegistration.addressEvidenceImage && (
                    <div className="mb-4">
                      <h4 className="text-md font-medium mb-2">
                        Address Verification
                      </h4>
                      {selectedRegistration.addressEvidenceType && (
                        <div className="mb-2">
                          <Label className="text-sm font-medium">
                            Evidence Type
                          </Label>
                          <p className="text-gray-900">
                            {selectedRegistration.addressEvidenceType.replace(
                              /_/g,
                              " ",
                            )}
                          </p>
                        </div>
                      )}
                      <div className="mt-3">
                        <Label className="text-sm font-medium">
                          Address Evidence
                        </Label>
                        <div className="mt-2">
                          <img
                            src={selectedRegistration.addressEvidenceImage}
                            alt="Address Evidence"
                            className="max-w-full h-auto rounded border"
                            style={{ maxHeight: "300px" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              <div className="border-t pt-4">
                <Label htmlFor="adminNotes" className="text-sm font-medium">
                  Admin Notes
                </Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this registration..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Action Buttons */}
              {selectedRegistration.status === "PENDING" && (
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleProcessRegistration("REJECT")}
                    disabled={processing}
                  >
                    {processing ? "Processing..." : "Reject"}
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleProcessRegistration("APPROVE")}
                    disabled={processing}
                  >
                    {processing ? "Processing..." : "Approve"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
