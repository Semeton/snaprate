"use client";

import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BusinessCategory, State } from "@/types";
import { TrendingUp, CheckCircle } from "lucide-react";

interface BusinessRecommendationFormProps {
  onSuccess?: () => void;
}

export default function BusinessRecommendationForm({
  onSuccess,
}: BusinessRecommendationFormProps) {
  const [formData, setFormData] = useState({
    businessName: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    description: "",
    reason: "",
    // Owner information
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerAddress: "",
    ownerCity: "",
    ownerState: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Structure the data to match the API expectation
      const requestData = {
        business: {
          businessName: formData.businessName,
          businessCategory: formData.category,
          businessPhone: formData.phone,
          businessEmail: formData.email,
          businessAddress: formData.address,
          businessCity: formData.city,
          businessState: formData.state,
          businessDescription: formData.description,
        },
        owner: {
          ownerName: formData.ownerName,
          ownerEmail: formData.ownerEmail,
          ownerPhone: formData.ownerPhone,
          ownerAddress: formData.ownerAddress,
          ownerCity: formData.ownerCity,
          ownerState: formData.ownerState,
          additionalNotes: formData.reason,
        },
      };

      const response = await fetch("/api/reviewer/business-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setFormData({
          businessName: "",
          category: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          state: "",
          description: "",
          reason: "",
          ownerName: "",
          ownerEmail: "",
          ownerPhone: "",
          ownerAddress: "",
          ownerCity: "",
          ownerState: "",
        });
        onSuccess?.();
      } else {
        setError(data.error || "Failed to submit recommendation");
      }
    } catch (error) {
      setError("An error occurred while submitting the recommendation");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <span>Recommend a Business</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Recommend a new business and earn ₦100 when approved!
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) =>
                  handleInputChange("businessName", e.target.value)
                }
                placeholder="Enter business name"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter business address"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Enter city"
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleInputChange("state", value)}
              >
                <SelectTrigger>
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
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the business and its services"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="reason">
              Why are you recommending this business? *
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
              placeholder="Tell us why you think this business should be on SnapRate"
              rows={3}
              required
            />
          </div>

          {/* Owner Information Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Owner Information
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide the business owner&apos;s contact details
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) =>
                    handleInputChange("ownerName", e.target.value)
                  }
                  placeholder="Enter owner's full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ownerEmail">Owner Email *</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) =>
                    handleInputChange("ownerEmail", e.target.value)
                  }
                  placeholder="Enter owner's email address"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="ownerPhone">Owner Phone *</Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  value={formData.ownerPhone}
                  onChange={(e) =>
                    handleInputChange("ownerPhone", e.target.value)
                  }
                  placeholder="Enter owner's phone number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ownerAddress">Owner Address</Label>
                <Input
                  id="ownerAddress"
                  value={formData.ownerAddress}
                  onChange={(e) =>
                    handleInputChange("ownerAddress", e.target.value)
                  }
                  placeholder="Enter owner's address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="ownerCity">Owner City</Label>
                <Input
                  id="ownerCity"
                  value={formData.ownerCity}
                  onChange={(e) =>
                    handleInputChange("ownerCity", e.target.value)
                  }
                  placeholder="Enter owner's city"
                />
              </div>
              <div>
                <Label htmlFor="ownerState">Owner State</Label>
                <Select
                  value={formData.ownerState}
                  onValueChange={(value) =>
                    handleInputChange("ownerState", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner's state" />
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
          </div>

          {error && (
            <Alert className="border-red-500 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? "Submitting..." : "Submit Recommendation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
