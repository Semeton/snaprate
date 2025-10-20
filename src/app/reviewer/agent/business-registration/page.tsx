"use client";

import { useState, useEffect, useCallback } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Building2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Shield,
} from "lucide-react";
import { BusinessCategory, State } from "@/types";

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
  submittedAt: string;
  verifiedAt: string | null;
  adminNotes: string | null;
  business?: {
    id: string;
    name: string;
    isVerified: boolean;
    verificationSource: string;
  };
}

interface RegistrationStats {
  totalRegistrations: number;
  pendingRegistrations: number;
  verifiedRegistrations: number;
  rejectedRegistrations: number;
  fullRegistrations: number;
  recommendations: number;
  verifiedBusinessesCount: number;
  canEarnFromRegistrations: boolean;
  earningsStartFrom: number;
}

// Use the enum values from types to ensure consistency with Prisma schema
const businessCategories = Object.values(BusinessCategory);

const idDocumentTypes = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "INTERNATIONAL_PASSPORT", label: "International Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "VOTER_CARD", label: "Voter Card" },
];

const cacDocumentTypes = [
  {
    value: "CAC_CERTIFICATE_OF_INCORPORATION",
    label: "CAC Certificate of Incorporation",
  },
  { value: "CAC_STATUS_REPORT", label: "CAC Status Report" },
  {
    value: "CAC_BUSINESS_NAME_REGISTRATION",
    label: "CAC Business Name Registration",
  },
];

const addressEvidenceTypes = [
  { value: "UTILITY_BILL", label: "Utility Bill" },
  { value: "LEASE_AGREEMENT", label: "Lease Agreement" },
  { value: "SIGNAGE_PHOTO", label: "Business Signage Photo" },
];

// Use the enum values from types to ensure consistency with Prisma schema
const states = Object.values(State);

export default function BusinessRegistrationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [registrations, setRegistrations] = useState<BusinessRegistration[]>(
    [],
  );
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [formData, setFormData] = useState({
    registrationType: "FULL_REGISTRATION" as
      | "FULL_REGISTRATION"
      | "RECOMMENDATION",
    businessName: "",
    businessDescription: "",
    businessCategory: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessWebsite: "",
    directorIdType: "",
    directorIdNumber: "",
    directorIdImage: "",
    cacDocumentType: "",
    cacDocumentImage: "",
    firsTaxClearance: "",
    addressEvidenceType: "",
    addressEvidenceImage: "",
    // Owner information fields
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerAddress: "",
    ownerCity: "",
    ownerState: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [registrationsRes, statsRes] = await Promise.all([
        fetch("/api/agent/business-registration"),
        fetch("/api/agent/registration-stats"),
      ]);

      if (registrationsRes.ok) {
        const registrationsData = await registrationsRes.json();
        setRegistrations(registrationsData.data.registrations);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data.statistics);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch registration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (session.user.role !== "REVIEWER") {
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [session, status, router, fetchData]);

  const handleFileUpload = async (file: File, field: string) => {
    try {
      console.log(
        "Uploading business registration file:",
        file.name,
        file.size,
        file.type,
      );

      // Validate file exists and has content
      if (!file || file.size === 0) {
        throw new Error("No file selected or file is empty");
      }

      const formData = new FormData();
      formData.append("files", file); // Fixed: use "files" (plural)
      formData.append("type", "image"); // Fixed: use "type" instead of "folder"

      console.log("FormData entries:", Array.from(formData.entries()));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Upload response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Upload response:", data);
        if (data.success && data.data.files && data.data.files.length > 0) {
          setFormData((prev) => ({
            ...prev,
            [field]: data.data.files[0],
          }));
          toast({
            title: "Upload successful",
            description: "File uploaded successfully",
          });
          return data.data.files[0];
        } else {
          throw new Error("Upload response format invalid");
        }
      } else {
        const errorData = await response.json();
        console.error("Upload error response:", errorData);
        throw new Error(errorData.error || "Upload failed");
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Client-side validation for full registration
      // Check if Director ID is provided
      if (
        !formData.directorIdType ||
        !formData.directorIdNumber ||
        !formData.directorIdImage
      ) {
        toast({
          title: "Validation Error",
          description:
            "Director ID information is mandatory for full registration",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Check if either CAC or address evidence is provided
      if (!formData.cacDocumentImage && !formData.addressEvidenceImage) {
        toast({
          title: "Validation Error",
          description:
            "You must provide either CAC documents OR address evidence for verification",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Validate owner information (required for all registrations)
      if (
        !formData.ownerName ||
        !formData.ownerEmail ||
        !formData.ownerPhone ||
        !formData.ownerAddress ||
        !formData.ownerCity ||
        !formData.ownerState
      ) {
        toast({
          title: "Validation Error",
          description: "All business owner information fields are required",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const response = await fetch("/api/agent/business-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        setShowCreateDialog(false);
        resetForm();
        fetchData();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting registration:", error);
      toast({
        title: "Error",
        description: "Failed to submit registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      registrationType: "FULL_REGISTRATION",
      businessName: "",
      businessDescription: "",
      businessCategory: "",
      businessPhone: "",
      businessEmail: "",
      businessAddress: "",
      businessCity: "",
      businessState: "",
      businessWebsite: "",
      directorIdType: "",
      directorIdNumber: "",
      directorIdImage: "",
      cacDocumentType: "",
      cacDocumentImage: "",
      firsTaxClearance: "",
      addressEvidenceType: "",
      addressEvidenceImage: "",
      // Owner information fields
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      ownerAddress: "",
      ownerCity: "",
      ownerState: "",
    });
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
            <p className="text-gray-600">Loading registration data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Business Registration
        </h1>
        <p className="text-gray-600">
          Register businesses and track your progress as an agent
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Registrations
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRegistrations}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.fullRegistrations} full, {stats.recommendations}{" "}
                recommendations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Businesses
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.verifiedBusinessesCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.verifiedBusinessesCount >= 2
                  ? "Agent approved!"
                  : `${2 - stats.verifiedBusinessesCount} more needed`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingRegistrations}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting admin review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Earnings Status
              </CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.canEarnFromRegistrations ? "Active" : "Pending"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.canEarnFromRegistrations
                  ? `Earning from ${stats.earningsStartFrom}+ businesses`
                  : `${3 - stats.verifiedBusinessesCount} more needed`}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Requirements Alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Agent Requirements:</strong> You need to register 2 verified
          businesses to be auto-approved as an agent. You&apos;ll start earning
          from the 3rd registered business onwards. Maximum 5 pending
          registrations allowed.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Register Business
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Business</DialogTitle>
              <DialogDescription>
                Choose between full registration (with verification documents)
                or recommendation (basic info only)
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Registration Type */}
              <div>
                <Label
                  htmlFor="registrationType"
                  className="text-sm font-medium"
                >
                  Registration Type *
                </Label>
                <Select
                  value={formData.registrationType}
                  onValueChange={(
                    value: "FULL_REGISTRATION" | "RECOMMENDATION",
                  ) =>
                    setFormData((prev) => ({
                      ...prev,
                      registrationType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select registration type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_REGISTRATION">
                      Full Registration (Complete business details +
                      verification documents)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="businessName"
                      className="text-sm font-medium"
                    >
                      Business Name *
                    </Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          businessName: e.target.value,
                        }))
                      }
                      placeholder="Enter business name"
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="businessCategory"
                      className="text-sm font-medium"
                    >
                      Category *
                    </Label>
                    <Select
                      value={formData.businessCategory}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          businessCategory: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="businessDescription"
                    className="text-sm font-medium"
                  >
                    Description{" "}
                    {formData.registrationType === "FULL_REGISTRATION"
                      ? "*"
                      : ""}
                  </Label>
                  <Textarea
                    id="businessDescription"
                    value={formData.businessDescription}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        businessDescription: e.target.value,
                      }))
                    }
                    placeholder="Describe the business"
                    rows={3}
                    required={formData.registrationType === "FULL_REGISTRATION"}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="businessPhone"
                      className="text-sm font-medium"
                    >
                      Phone{" "}
                      {formData.registrationType === "FULL_REGISTRATION"
                        ? "*"
                        : ""}
                    </Label>
                    <Input
                      id="businessPhone"
                      value={formData.businessPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          businessPhone: e.target.value,
                        }))
                      }
                      placeholder="Enter phone number"
                      required={
                        formData.registrationType === "FULL_REGISTRATION"
                      }
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="businessEmail"
                      className="text-sm font-medium"
                    >
                      Email{" "}
                      {formData.registrationType === "FULL_REGISTRATION"
                        ? "*"
                        : ""}
                    </Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          businessEmail: e.target.value,
                        }))
                      }
                      placeholder="Enter email address"
                      required={
                        formData.registrationType === "FULL_REGISTRATION"
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="businessAddress"
                    className="text-sm font-medium"
                  >
                    Address *
                  </Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        businessAddress: e.target.value,
                      }))
                    }
                    placeholder="Enter business address"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="businessCity"
                      className="text-sm font-medium"
                    >
                      City *
                    </Label>
                    <Input
                      id="businessCity"
                      value={formData.businessCity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          businessCity: e.target.value,
                        }))
                      }
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="businessState"
                      className="text-sm font-medium"
                    >
                      State *
                    </Label>
                    <Select
                      value={formData.businessState}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          businessState: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="businessWebsite"
                    className="text-sm font-medium"
                  >
                    Website
                  </Label>
                  <Input
                    id="businessWebsite"
                    value={formData.businessWebsite}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        businessWebsite: e.target.value,
                      }))
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Verification Documents - Only for Full Registration */}
              {formData.registrationType === "FULL_REGISTRATION" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Verification Documents
                  </h3>

                  {/* Director ID */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">
                      Director/Authorized Signatory ID *
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="directorIdType"
                          className="text-sm font-medium"
                        >
                          ID Type *
                        </Label>
                        <Select
                          value={formData.directorIdType}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              directorIdType: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                          <SelectContent>
                            {idDocumentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="directorIdNumber"
                          className="text-sm font-medium"
                        >
                          ID Number *
                        </Label>
                        <Input
                          id="directorIdNumber"
                          value={formData.directorIdNumber}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              directorIdNumber: e.target.value,
                            }))
                          }
                          placeholder="Enter ID number"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="directorIdImage"
                        className="text-sm font-medium"
                      >
                        ID Document Image *
                      </Label>
                      <div className="mt-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              await handleFileUpload(file, "directorIdImage");
                            }
                          }}
                          required
                        />
                        {formData.directorIdImage && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ File uploaded successfully
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Documents */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">
                      Business Documents (Required - Either CAC OR Address
                      Evidence)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="cacDocumentType"
                          className="text-sm font-medium"
                        >
                          CAC Document Type
                        </Label>
                        <Select
                          value={formData.cacDocumentType}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              cacDocumentType: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select CAC document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {cacDocumentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="cacDocumentImage"
                          className="text-sm font-medium"
                        >
                          CAC Document Image
                        </Label>
                        <div className="mt-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await handleFileUpload(
                                  file,
                                  "cacDocumentImage",
                                );
                              }
                            }}
                          />
                          {formData.cacDocumentImage && (
                            <p className="text-sm text-green-600 mt-1">
                              ✓ File uploaded successfully
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="firsTaxClearance"
                        className="text-sm font-medium"
                      >
                        FIRS Tax Clearance Certificate
                      </Label>
                      <div className="mt-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              await handleFileUpload(file, "firsTaxClearance");
                            }
                          }}
                        />
                        {formData.firsTaxClearance && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ File uploaded successfully
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Verification */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">
                      Address Verification (Required - Either CAC OR Address
                      Evidence)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="addressEvidenceType"
                          className="text-sm font-medium"
                        >
                          Address Evidence Type
                        </Label>
                        <Select
                          value={formData.addressEvidenceType}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              addressEvidenceType: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select evidence type" />
                          </SelectTrigger>
                          <SelectContent>
                            {addressEvidenceTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label
                          htmlFor="addressEvidenceImage"
                          className="text-sm font-medium"
                        >
                          Address Evidence Image
                        </Label>
                        <div className="mt-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await handleFileUpload(
                                  file,
                                  "addressEvidenceImage",
                                );
                              }
                            }}
                          />
                          {formData.addressEvidenceImage && (
                            <p className="text-sm text-green-600 mt-1">
                              ✓ File uploaded successfully
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Important:</strong> Director ID is mandatory. You
                      must also provide either CAC documents OR address evidence
                      for verification.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Owner Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Business Owner Information *
                </h3>
                <p className="text-sm text-gray-600">
                  Provide the business owner's details. An account will be
                  created for them and an invitation email will be sent.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerName" className="text-sm font-medium">
                      Owner Name *
                    </Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ownerName: e.target.value,
                        }))
                      }
                      placeholder="Enter business owner's full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerEmail" className="text-sm font-medium">
                      Owner Email *
                    </Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ownerEmail: e.target.value,
                        }))
                      }
                      placeholder="Enter business owner's email"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerPhone" className="text-sm font-medium">
                      Owner Phone *
                    </Label>
                    <Input
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ownerPhone: e.target.value,
                        }))
                      }
                      placeholder="Enter business owner's phone"
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="ownerAddress"
                      className="text-sm font-medium"
                    >
                      Owner Address *
                    </Label>
                    <Input
                      id="ownerAddress"
                      value={formData.ownerAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ownerAddress: e.target.value,
                        }))
                      }
                      placeholder="Enter business owner's address"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerCity" className="text-sm font-medium">
                      Owner City *
                    </Label>
                    <Input
                      id="ownerCity"
                      value={formData.ownerCity}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ownerCity: e.target.value,
                        }))
                      }
                      placeholder="Enter business owner's city"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerState" className="text-sm font-medium">
                      Owner State *
                    </Label>
                    <Select
                      value={formData.ownerState}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          ownerState: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner's state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? "Submitting..." : "Submit Registration"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Registrations List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Business Registrations</CardTitle>
          <CardDescription>
            Track the status of your business registrations and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No registrations yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start by registering your first business
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Register Business
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((registration) => (
                <div key={registration.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {registration.businessName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {registration.businessCategory?.replace(/_/g, " ")} •{" "}
                        {registration.businessCity},{" "}
                        {registration.businessState}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {getTypeBadge(registration.registrationType)}
                      {getStatusBadge(registration.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Submitted:</strong>{" "}
                        {new Date(
                          registration.submittedAt,
                        ).toLocaleDateString()}
                      </p>
                      {registration.verifiedAt && (
                        <p>
                          <strong>Verified:</strong>{" "}
                          {new Date(
                            registration.verifiedAt,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      {registration.businessEmail && (
                        <p>
                          <strong>Email:</strong> {registration.businessEmail}
                        </p>
                      )}
                      {registration.businessPhone && (
                        <p>
                          <strong>Phone:</strong> {registration.businessPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  {registration.adminNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm">
                        <strong>Admin Notes:</strong> {registration.adminNotes}
                      </p>
                    </div>
                  )}

                  {registration.business && (
                    <div className="mt-3 p-3 bg-green-50 rounded">
                      <p className="text-sm text-green-800">
                        <strong>✓ Business Created:</strong>{" "}
                        {registration.business.name}
                        {registration.business.isVerified && " (Verified)"}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
