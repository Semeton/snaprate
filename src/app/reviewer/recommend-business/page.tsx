"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "@/components/ui/use-toast";
import {
  Building2,
  User,
  Shield,
  ArrowLeft,
  Send,
  AlertCircle,
} from "lucide-react";

import { BusinessCategory, State } from "@/types";
import { Badge } from "@/components/ui/badge";

export default function RecommendBusinessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);

  // Business details form state
  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    businessCategory: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessPhone: "",
    businessEmail: "",
    businessWebsite: "",
    businessDescription: "",
  });

  // Owner details form state
  const [ownerForm, setOwnerForm] = useState({
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerAddress: "",
    ownerCity: "",
    ownerState: "",
    additionalNotes: "",
  });

  // Verification documents state (for agents only)
  const [verificationForm, setVerificationForm] = useState({
    directorIdType: "",
    directorIdNumber: "",
    directorIdImage: "",
    cacDocumentType: "",
    cacDocumentImage: "",
    firsTaxClearance: "",
    addressEvidenceType: "",
    addressEvidenceImage: "",
  });

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isApprovedAgent, setIsApprovedAgent] = useState(false);
  const [registrationType, setRegistrationType] = useState<
    "RECOMMENDATION" | "FULL_REGISTRATION"
  >("RECOMMENDATION");

  useEffect(() => {
    if (status === "authenticated" && session?.user && !isRedirecting) {
      if (!["REVIEWER", "AGENT"].includes(session.user.role)) {
        setIsRedirecting(true);
        router.push("/reviewer/dashboard");
        return;
      }
    }
  }, [session, status, router, isRedirecting]);

  useEffect(() => {
    const checkAgentStatus = async () => {
      if (status === "authenticated" && session?.user?.role === "AGENT") {
        try {
          const response = await fetch("/api/reviewer/agent-stats");
          if (response.ok) {
            const data = await response.json();
            setIsApprovedAgent(data.data?.isApprovedAgent || false);
          }
        } catch (error) {
          console.error("Failed to check agent status:", error);
        }
      }
    };

    checkAgentStatus();
  }, [status, session]);

  const handleBusinessFormChange = (field: string, value: string) => {
    setBusinessForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOwnerFormChange = (field: string, value: string) => {
    setOwnerForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleVerificationFormChange = (field: string, value: string) => {
    setVerificationForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, field: string) => {
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("type", "image");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.files && data.data.files.length > 0) {
          handleVerificationFormChange(field, data.data.files[0]);
          toast({
            title: "File uploaded successfully",
            description: "Your document has been uploaded.",
          });
        } else {
          throw new Error("Upload response format invalid");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const requiredBusinessFields = [
      "businessName",
      "businessCategory",
      "businessAddress",
      "businessCity",
      "businessState",
    ];
    const requiredOwnerFields = ["ownerName", "ownerPhone", "ownerEmail"];

    const missingBusinessFields = requiredBusinessFields.filter(
      (field) => !businessForm[field as keyof typeof businessForm],
    );
    const missingOwnerFields = requiredOwnerFields.filter(
      (field) => !ownerForm[field as keyof typeof ownerForm],
    );

    // Validate verification documents based on user type
    let missingVerificationFields: string[] = [];

    // If user selected full registration, validate required fields
    if (registrationType === "FULL_REGISTRATION") {
      const requiredVerificationFields = [
        "directorIdType",
        "directorIdNumber",
        "directorIdImage",
      ];
      missingVerificationFields = requiredVerificationFields.filter(
        (field) => !verificationForm[field as keyof typeof verificationForm],
      );

      // Check if either CAC or address evidence is provided
      if (
        !verificationForm.cacDocumentImage &&
        !verificationForm.addressEvidenceImage
      ) {
        missingVerificationFields.push(
          "cacDocumentImage or addressEvidenceImage",
        );
      }
    }

    if (
      missingBusinessFields.length > 0 ||
      missingOwnerFields.length > 0 ||
      missingVerificationFields.length > 0
    ) {
      const missingFields = [
        ...missingBusinessFields,
        ...missingOwnerFields,
        ...missingVerificationFields,
      ];
      toast({
        title: "Missing Information",
        description: `Please fill in all required fields: ${missingFields.join(
          ", ",
        )}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Use the selected registration type
      if (registrationType === "FULL_REGISTRATION") {
        // Submit as full business registration with verification documents
        const registrationData = {
          registrationType: "FULL_REGISTRATION",
          businessName: businessForm.businessName,
          businessDescription: businessForm.businessDescription,
          businessCategory: businessForm.businessCategory,
          businessPhone: businessForm.businessPhone,
          businessEmail: businessForm.businessEmail,
          businessAddress: businessForm.businessAddress,
          businessCity: businessForm.businessCity,
          businessState: businessForm.businessState,
          businessWebsite: businessForm.businessWebsite,
          // Owner information
          ownerName: ownerForm.ownerName,
          ownerEmail: ownerForm.ownerEmail,
          ownerPhone: ownerForm.ownerPhone,
          ownerAddress: ownerForm.ownerAddress,
          ownerCity: ownerForm.ownerCity,
          ownerState: ownerForm.ownerState,
          // Verification documents
          directorIdType: verificationForm.directorIdType,
          directorIdNumber: verificationForm.directorIdNumber,
          directorIdImage: verificationForm.directorIdImage,
          cacDocumentType: verificationForm.cacDocumentType || null,
          cacDocumentImage: verificationForm.cacDocumentImage || null,
          firsTaxClearance: verificationForm.firsTaxClearance || null,
          addressEvidenceType: verificationForm.addressEvidenceType || null,
          addressEvidenceImage: verificationForm.addressEvidenceImage || null,
        };

        const response = await fetch("/api/agent/business-registration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registrationData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description:
              "Business registration submitted successfully! We'll review it and get back to you within 48 hours.",
          });
        } else {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to submit business registration",
          );
        }
      } else {
        // Submit as business recommendation (basic info only)
        const recommendationData = {
          business: businessForm,
          owner: ownerForm,
        };

        const response = await fetch("/api/reviewer/business-recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(recommendationData),
        });

        if (response.ok) {
          toast({
            title: "Success",
            description:
              "Business recommendation submitted successfully! We'll review it and get back to you within 48 hours.",
          });
        } else {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to submit business recommendation",
          );
        }
      }

      // Reset forms
      setBusinessForm({
        businessName: "",
        businessCategory: "",
        businessAddress: "",
        businessCity: "",
        businessState: "",
        businessPhone: "",
        businessEmail: "",
        businessWebsite: "",
        businessDescription: "",
      });
      setOwnerForm({
        ownerName: "",
        ownerPhone: "",
        ownerEmail: "",
        ownerAddress: "",
        ownerCity: "",
        ownerState: "",
        additionalNotes: "",
      });
      setVerificationForm({
        directorIdType: "",
        directorIdNumber: "",
        directorIdImage: "",
        cacDocumentType: "",
        cacDocumentImage: "",
        firsTaxClearance: "",
        addressEvidenceType: "",
        addressEvidenceImage: "",
      });
      setRegistrationType("RECOMMENDATION");

      // Redirect to appropriate dashboard
      if (isApprovedAgent || session?.user?.role === "AGENT") {
        router.push("/reviewer/agent-dashboard");
      } else {
        router.push("/reviewer/dashboard");
      }
    } catch (error) {
      console.error("Failed to submit recommendation:", error);
      toast({
        title: "Error",
        description: "An error occurred while submitting your recommendation",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isRedirecting ? "Redirecting..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  // Check if user is an agent
  if (session?.user?.role !== "AGENT") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Shield className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be an approved agent to access this page.
          </p>
          <Button onClick={() => router.push("/reviewer/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => {
                  if (session?.user?.role === "AGENT") {
                    router.push("/reviewer/agent-dashboard");
                  } else {
                    router.push("/reviewer/dashboard");
                  }
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Recommend Business
                </h1>
                <p className="text-gray-600">
                  Help businesses join our platform and earn rewards
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 border-green-200"
              >
                <Shield className="h-4 w-4 mr-2" />
                AGENT
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Card */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  How Business Recommendations Work
                </h3>
                <div className="text-blue-700 text-sm space-y-1">
                  <p>• Submit business and owner details for review</p>
                  <p>• Our team will verify the information</p>
                  <p>• Approved businesses get added to the platform</p>
                  <p>• You earn ₦100 for each approved recommendation</p>
                  <p>
                    • Business owners get notified to complete their profile
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Registration Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Registration Type</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Choose between a basic recommendation or full business
                registration with verification documents.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      registrationType === "RECOMMENDATION"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setRegistrationType("RECOMMENDATION");
                      // Clear verification form when switching to basic recommendation
                      setVerificationForm({
                        directorIdType: "",
                        directorIdNumber: "",
                        directorIdImage: "",
                        cacDocumentType: "",
                        cacDocumentImage: "",
                        firsTaxClearance: "",
                        addressEvidenceType: "",
                        addressEvidenceImage: "",
                      });
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          registrationType === "RECOMMENDATION"
                            ? "border-green-500 bg-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        {registrationType === "RECOMMENDATION" && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">Basic Recommendation</h3>
                        <p className="text-sm text-gray-600">
                          Submit basic business information for review. No
                          verification documents required.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      registrationType === "FULL_REGISTRATION"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setRegistrationType("FULL_REGISTRATION");
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          registrationType === "FULL_REGISTRATION"
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {registrationType === "FULL_REGISTRATION" && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">Full Registration</h3>
                        <p className="text-sm text-gray-600">
                          Submit complete business registration with
                          verification documents for faster approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={businessForm.businessName}
                    onChange={(e) =>
                      handleBusinessFormChange("businessName", e.target.value)
                    }
                    placeholder="Enter business name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessCategory">Business Category *</Label>
                  <Select
                    value={businessForm.businessCategory}
                    onValueChange={(value) =>
                      handleBusinessFormChange("businessCategory", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(BusinessCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    value={businessForm.businessPhone}
                    onChange={(e) =>
                      handleBusinessFormChange("businessPhone", e.target.value)
                    }
                    placeholder="Business phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessForm.businessEmail}
                    onChange={(e) =>
                      handleBusinessFormChange("businessEmail", e.target.value)
                    }
                    placeholder="Business email address"
                  />
                </div>

                <div>
                  <Label htmlFor="businessWebsite">Business Website</Label>
                  <Input
                    id="businessWebsite"
                    value={businessForm.businessWebsite}
                    onChange={(e) =>
                      handleBusinessFormChange(
                        "businessWebsite",
                        e.target.value,
                      )
                    }
                    placeholder="https://example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Input
                    id="businessAddress"
                    value={businessForm.businessAddress}
                    onChange={(e) =>
                      handleBusinessFormChange(
                        "businessAddress",
                        e.target.value,
                      )
                    }
                    placeholder="Street address"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessCity">City *</Label>
                  <Input
                    id="businessCity"
                    value={businessForm.businessCity}
                    onChange={(e) =>
                      handleBusinessFormChange("businessCity", e.target.value)
                    }
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessState">State *</Label>
                  <Select
                    value={businessForm.businessState}
                    onValueChange={(value) =>
                      handleBusinessFormChange("businessState", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(State).map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="businessDescription">
                    Business Description
                  </Label>
                  <Textarea
                    id="businessDescription"
                    value={businessForm.businessDescription}
                    onChange={(e) =>
                      handleBusinessFormChange(
                        "businessDescription",
                        e.target.value,
                      )
                    }
                    placeholder="Brief description of the business, services offered, etc."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Business Owner Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    value={ownerForm.ownerName}
                    onChange={(e) =>
                      handleOwnerFormChange("ownerName", e.target.value)
                    }
                    placeholder="Full name of business owner"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ownerPhone">Owner Phone *</Label>
                  <Input
                    id="ownerPhone"
                    value={ownerForm.ownerPhone}
                    onChange={(e) =>
                      handleOwnerFormChange("ownerPhone", e.target.value)
                    }
                    placeholder="Owner's phone number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ownerEmail">Owner Email *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={ownerForm.ownerEmail}
                    onChange={(e) =>
                      handleOwnerFormChange("ownerEmail", e.target.value)
                    }
                    placeholder="Owner's email address"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ownerCity">Owner City</Label>
                  <Input
                    id="ownerCity"
                    value={ownerForm.ownerCity}
                    onChange={(e) =>
                      handleOwnerFormChange("ownerCity", e.target.value)
                    }
                    placeholder="Owner's city"
                  />
                </div>

                <div>
                  <Label htmlFor="ownerState">Owner State</Label>
                  <Select
                    value={ownerForm.ownerState}
                    onValueChange={(value) =>
                      handleOwnerFormChange("ownerState", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(State).map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="ownerAddress">Owner Address</Label>
                  <Input
                    id="ownerAddress"
                    value={ownerForm.ownerAddress}
                    onChange={(e) =>
                      handleOwnerFormChange("ownerAddress", e.target.value)
                    }
                    placeholder="Owner's address (if different from business)"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={ownerForm.additionalNotes}
                    onChange={(e) =>
                      handleOwnerFormChange("additionalNotes", e.target.value)
                    }
                    placeholder="Any additional information about the business or owner that might be helpful"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Verification Documents (Full Registration)</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                {registrationType === "FULL_REGISTRATION"
                  ? "Complete the verification documents below for full business registration."
                  : "Select 'Full Registration' above to enable verification document fields."}
              </p>
            </CardHeader>
            <CardContent>
              <div
                className={`space-y-6 ${
                  registrationType !== "FULL_REGISTRATION"
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
                {/* Director ID Section */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium">
                    Director/Authorized Signatory ID *
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="directorIdType">ID Type *</Label>
                      <Select
                        value={verificationForm.directorIdType}
                        onValueChange={(value) =>
                          handleVerificationFormChange("directorIdType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NATIONAL_ID">
                            National ID
                          </SelectItem>
                          <SelectItem value="INTERNATIONAL_PASSPORT">
                            International Passport
                          </SelectItem>
                          <SelectItem value="DRIVERS_LICENSE">
                            Driver&apos;s License
                          </SelectItem>
                          <SelectItem value="VOTER_CARD">Voter Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="directorIdNumber">ID Number *</Label>
                      <Input
                        id="directorIdNumber"
                        value={verificationForm.directorIdNumber}
                        onChange={(e) =>
                          handleVerificationFormChange(
                            "directorIdNumber",
                            e.target.value,
                          )
                        }
                        placeholder="Enter ID number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="directorIdImage">ID Document Image *</Label>
                    <div className="mt-2">
                      <label
                        htmlFor="directorIdImage"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        {verificationForm.directorIdImage ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <Shield className="h-5 w-5" />
                            <span>Document uploaded</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Shield className="w-8 h-8 mb-4 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              ID document
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG (MAX. 10MB)
                            </p>
                          </div>
                        )}
                        <input
                          id="directorIdImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, "directorIdImage");
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* CAC Documents Section */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium">CAC Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cacDocumentType">CAC Document Type</Label>
                      <Select
                        value={verificationForm.cacDocumentType}
                        onValueChange={(value) =>
                          handleVerificationFormChange("cacDocumentType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select CAC document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CAC_CERTIFICATE_OF_INCORPORATION">
                            CAC Certificate of Incorporation
                          </SelectItem>
                          <SelectItem value="CAC_STATUS_REPORT">
                            CAC Status Report
                          </SelectItem>
                          <SelectItem value="CAC_BUSINESS_NAME_REGISTRATION">
                            CAC Business Name Registration
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="cacDocumentImage">
                        CAC Document Image
                      </Label>
                      <div className="mt-2">
                        <label
                          htmlFor="cacDocumentImage"
                          className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          {verificationForm.cacDocumentImage ? (
                            <div className="flex items-center space-x-2 text-green-600">
                              <Shield className="h-4 w-4" />
                              <span className="text-sm">
                                CAC document uploaded
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-3 pb-4">
                              <Shield className="w-6 h-6 mb-2 text-gray-500" />
                              <p className="text-xs text-gray-500">
                                Click to upload CAC document
                              </p>
                            </div>
                          )}
                          <input
                            id="cacDocumentImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, "cacDocumentImage");
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Evidence Section */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium">Address Evidence</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="addressEvidenceType">
                        Address Evidence Type
                      </Label>
                      <Select
                        value={verificationForm.addressEvidenceType}
                        onValueChange={(value) =>
                          handleVerificationFormChange(
                            "addressEvidenceType",
                            value,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select address evidence type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTILITY_BILL">
                            Utility Bill
                          </SelectItem>
                          <SelectItem value="LEASE_AGREEMENT">
                            Lease Agreement
                          </SelectItem>
                          <SelectItem value="SIGNAGE_PHOTO">
                            Business Signage Photo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="addressEvidenceImage">
                        Address Evidence Image
                      </Label>
                      <div className="mt-2">
                        <label
                          htmlFor="addressEvidenceImage"
                          className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          {verificationForm.addressEvidenceImage ? (
                            <div className="flex items-center space-x-2 text-green-600">
                              <Shield className="h-4 w-4" />
                              <span className="text-sm">
                                Address evidence uploaded
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-3 pb-4">
                              <Shield className="w-6 h-6 mb-2 text-gray-500" />
                              <p className="text-xs text-gray-500">
                                Click to upload address evidence
                              </p>
                            </div>
                          )}
                          <input
                            id="addressEvidenceImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file, "addressEvidenceImage");
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FIRS Tax Clearance */}
                <div>
                  <Label htmlFor="firsTaxClearance">
                    FIRS Tax Clearance (Optional)
                  </Label>
                  <div className="mt-2">
                    <label
                      htmlFor="firsTaxClearance"
                      className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      {verificationForm.firsTaxClearance ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <Shield className="h-4 w-4" />
                          <span className="text-sm">
                            FIRS tax clearance uploaded
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-3 pb-4">
                          <Shield className="w-6 h-6 mb-2 text-gray-500" />
                          <p className="text-xs text-gray-500">
                            Click to upload FIRS tax clearance
                          </p>
                        </div>
                      )}
                      <input
                        id="firsTaxClearance"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, "firsTaxClearance");
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Important:</p>
                      <p>
                        {registrationType === "FULL_REGISTRATION"
                          ? "Director ID is mandatory. You must also provide either CAC documents OR address evidence for verification."
                          : "Select 'Full Registration' above to enable verification document fields."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting
                ? "Submitting..."
                : registrationType === "FULL_REGISTRATION"
                ? "Submit Business Registration"
                : "Submit Recommendation"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
