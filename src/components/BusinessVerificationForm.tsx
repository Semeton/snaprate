"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle,
  Upload,
  FileText,
  Building2,
  MapPin,
  UserCheck,
} from "lucide-react";

interface VerificationData {
  directorIdType: string;
  directorIdNumber: string;
  directorIdImage: string | null;
  cacDocumentType: string | null;
  cacDocumentImage: string | null;
  firsTaxClearance: string | null;
  addressEvidenceType: string | null;
  addressEvidenceImage: string | null;
}

interface VerificationStatus {
  verification: {
    id: string;
    directorIdType: string;
    directorIdNumber: string;
    directorIdImage: string;
    cacDocumentType?: string | null;
    cacDocumentImage?: string;
    firsTaxClearance?: string;
    addressEvidenceType?: string | null;
    addressEvidenceImage?: string;
    adminNotes?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  business: {
    id: string;
    verificationStatus: string;
    addressVerificationStatus: string;
    reviewStatus: string;
  };
}

const directorIdTypes = [
  { value: "NATIONAL_ID", label: "National ID Card" },
  { value: "INTERNATIONAL_PASSPORT", label: "International Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "VOTER_CARD", label: "Voter's Card" },
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

export default function BusinessVerificationForm() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus | null>(null);
  const [formData, setFormData] = useState<VerificationData>({
    directorIdType: "",
    directorIdNumber: "",
    directorIdImage: null,
    cacDocumentType: null,
    cacDocumentImage: null,
    firsTaxClearance: null,
    addressEvidenceType: null,
    addressEvidenceImage: null,
  });

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch("/api/business/verification");
      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data.data);

        // Pre-fill form if verification exists
        if (data.data.verification) {
          setFormData({
            directorIdType: data.data.verification.directorIdType || "",
            directorIdNumber: data.data.verification.directorIdNumber || "",
            directorIdImage: data.data.verification.directorIdImage || null,
            cacDocumentType: data.data.verification.cacDocumentType || null,
            cacDocumentImage: data.data.verification.cacDocumentImage || null,
            firsTaxClearance: data.data.verification.firsTaxClearance || null,
            addressEvidenceType:
              data.data.verification.addressEvidenceType || null,
            addressEvidenceImage:
              data.data.verification.addressEvidenceImage || null,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    }
  };

  const handleInputChange = (
    field: keyof VerificationData,
    value: string | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (
    field: keyof VerificationData,
    file: File,
  ) => {
    try {
      console.log("Uploading file:", field, file.name, file.size, file.type);

      // Validate file exists and has content
      if (!file || file.size === 0) {
        throw new Error("No file selected or file is empty");
      }

      const formData = new FormData();
      formData.append("files", file);
      formData.append("type", "image"); // All verification documents are images

      console.log("FormData created, sending request...");
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
          handleInputChange(field, data.data.files[0]);
          toast({
            title: "File uploaded successfully",
            description: "Your document has been uploaded.",
          });
        } else {
          throw new Error("Upload response format invalid");
        }
      } else {
        const errorData = await response.json();
        console.error("Upload error response:", errorData);
        throw new Error(errorData.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Please try uploading your document again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (
        !formData.directorIdType ||
        !formData.directorIdNumber ||
        !formData.directorIdImage
      ) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required director ID fields.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate that at least one additional verification document is provided
      const hasBusinessDocuments =
        formData.cacDocumentType && formData.cacDocumentImage;
      const hasAddressEvidence =
        formData.addressEvidenceType && formData.addressEvidenceImage;

      if (!hasBusinessDocuments && !hasAddressEvidence) {
        toast({
          title: "Additional verification required",
          description:
            "Please provide either business documents (CAC) or address verification evidence to complete your submission.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Clean the form data before submission
      const cleanedFormData = {
        ...formData,
        directorIdType: formData.directorIdType,
        directorIdNumber: formData.directorIdNumber,
        directorIdImage: formData.directorIdImage,
        cacDocumentType: formData.cacDocumentType,
        addressEvidenceType: formData.addressEvidenceType,
      };

      console.log("Submitting verification data:", cleanedFormData);

      const response = await fetch("/api/business/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedFormData),
      });

      if (response.ok) {
        toast({
          title: "Verification submitted successfully",
          description: "Your documents have been submitted for review.",
        });
        fetchVerificationStatus();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit verification");
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "UNVERIFIED":
        return <Badge className="bg-gray-100 text-gray-800">Unverified</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Verification</CardTitle>
          <CardDescription>
            Please sign in to access verification features.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      {verificationStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Document Verification:
                </span>
                {getStatusBadge(verificationStatus.business.verificationStatus)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Address Verification:
                </span>
                {getStatusBadge(
                  verificationStatus.business.addressVerificationStatus,
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Review Status:</span>
                {getStatusBadge(verificationStatus.business.reviewStatus)}
              </div>
            </div>

            {verificationStatus.verification?.adminNotes && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Admin Notes:</strong>{" "}
                  {verificationStatus.verification.adminNotes}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Submit Verification Documents
          </CardTitle>
          <CardDescription>
            Upload the required documents to verify your business. This helps
            build trust with customers and reviewers.
          </CardDescription>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Verification Requirements:</strong> You must provide your
              Director/Authorized Signatory ID (mandatory) AND either Business
              Documents (CAC) OR Address Verification evidence to complete your
              submission.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Director ID Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Director/Authorized Signatory ID
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="directorIdType">ID Type *</Label>
                  <Select
                    value={formData.directorIdType}
                    onValueChange={(value) =>
                      handleInputChange("directorIdType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      {directorIdTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="directorIdNumber">ID Number *</Label>
                  <Input
                    id="directorIdNumber"
                    value={formData.directorIdNumber}
                    onChange={(e) =>
                      handleInputChange("directorIdNumber", e.target.value)
                    }
                    placeholder="Enter ID number"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="directorIdImage">ID Image *</Label>
                <div className="mt-2">
                  {formData.directorIdImage ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        Document uploaded
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleInputChange("directorIdImage", null)
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          console.log("File input change:", e.target.files);
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log(
                              "Selected file:",
                              file.name,
                              file.size,
                              file.type,
                            );
                            handleFileUpload("directorIdImage", file);
                          } else {
                            console.log("No file selected");
                          }
                        }}
                        className="hidden"
                        id="directorIdImage"
                      />
                      <label
                        htmlFor="directorIdImage"
                        className="cursor-pointer"
                      >
                        <span className="text-sm text-gray-600">
                          Click to upload ID document
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Business Documents Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Documents (Required - Choose this OR Address
                Verification)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cacDocumentType">CAC Document Type</Label>
                  <Select
                    value={formData.cacDocumentType || ""}
                    onValueChange={(value) =>
                      handleInputChange(
                        "cacDocumentType",
                        value === "" ? null : value,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
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
                  <Label htmlFor="cacDocumentImage">CAC Document</Label>
                  <div className="mt-2">
                    {formData.cacDocumentImage ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          Document uploaded
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleInputChange("cacDocumentImage", null)
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              console.log(
                                "Selected CAC file:",
                                file.name,
                                file.size,
                                file.type,
                              );
                              handleFileUpload("cacDocumentImage", file);
                            } else {
                              console.log("No CAC file selected");
                            }
                          }}
                          className="hidden"
                          id="cacDocumentImage"
                        />
                        <label
                          htmlFor="cacDocumentImage"
                          className="cursor-pointer"
                        >
                          <span className="text-sm text-gray-600">
                            Upload CAC document
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="firsTaxClearance">FIRS Tax Clearance</Label>
                <div className="mt-2">
                  {formData.firsTaxClearance ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        Document uploaded
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleInputChange("firsTaxClearance", null)
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log(
                              "Selected FIRS file:",
                              file.name,
                              file.size,
                              file.type,
                            );
                            handleFileUpload("firsTaxClearance", file);
                          } else {
                            console.log("No FIRS file selected");
                          }
                        }}
                        className="hidden"
                        id="firsTaxClearance"
                      />
                      <label
                        htmlFor="firsTaxClearance"
                        className="cursor-pointer"
                      >
                        <span className="text-sm text-gray-600">
                          Upload FIRS tax clearance
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Address Verification Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address Verification (Required - Choose this OR Business
                Documents)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="addressEvidenceType">Evidence Type</Label>
                  <Select
                    value={formData.addressEvidenceType || ""}
                    onValueChange={(value) =>
                      handleInputChange(
                        "addressEvidenceType",
                        value === "" ? null : value,
                      )
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
                  <Label htmlFor="addressEvidenceImage">Address Evidence</Label>
                  <div className="mt-2">
                    {formData.addressEvidenceImage ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          Document uploaded
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleInputChange("addressEvidenceImage", null)
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              console.log(
                                "Selected address evidence file:",
                                file.name,
                                file.size,
                                file.type,
                              );
                              handleFileUpload("addressEvidenceImage", file);
                            } else {
                              console.log("No address evidence file selected");
                            }
                          }}
                          className="hidden"
                          id="addressEvidenceImage"
                        />
                        <label
                          htmlFor="addressEvidenceImage"
                          className="cursor-pointer"
                        >
                          <span className="text-sm text-gray-600">
                            Upload address evidence
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting..." : "Submit Verification Documents"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
