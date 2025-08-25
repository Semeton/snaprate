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
  MapPin,
  Phone,
  Mail,
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

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role !== "AGENT") {
        router.push("/reviewer/dashboard");
        return;
      }
    }
  }, [session, status, router]);

  const handleBusinessFormChange = (field: string, value: string) => {
    setBusinessForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOwnerFormChange = (field: string, value: string) => {
    setOwnerForm((prev) => ({ ...prev, [field]: value }));
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

    if (missingBusinessFields.length > 0 || missingOwnerFields.length > 0) {
      const missingFields = [...missingBusinessFields, ...missingOwnerFields];
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

        // Redirect to agent dashboard
        router.push("/reviewer/agent-dashboard");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to submit recommendation",
          variant: "destructive",
        });
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

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
                onClick={() => router.push("/reviewer/agent-dashboard")}
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

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Submitting..." : "Submit Recommendation"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
