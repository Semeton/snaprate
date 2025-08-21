"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, TrendingUp, CheckCircle } from "lucide-react";

export default function RecommendBusiness() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
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
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName || !formData.category || !formData.address || !formData.city || !formData.state) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/businesses/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess("Business recommendation submitted successfully! You'll earn ₦100 if approved.");
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
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit recommendation");
      }
    } catch (error) {
      setError("An error occurred while submitting the recommendation");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recommend Business</h1>
              <p className="text-gray-600">Recommend a business and earn ₦100 when approved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Card */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Fill out the form below with business details</li>
                  <li>• Our team will review and verify the business</li>
                  <li>• If approved, you'll earn ₦100 as a reward</li>
                  <li>• The business will be added to our platform</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    placeholder="Enter business name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                      <SelectItem value="RETAIL">Retail</SelectItem>
                      <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                      <SelectItem value="EDUCATION">Education</SelectItem>
                      <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
                      <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                      <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                      <SelectItem value="AUTOMOTIVE">Automotive</SelectItem>
                      <SelectItem value="BEAUTY">Beauty</SelectItem>
                      <SelectItem value="FITNESS">Fitness</SelectItem>
                      <SelectItem value="TRAVEL">Travel</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Business phone number"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Business email address"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium">
                    Address *
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Street address"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-sm font-medium">
                    City *
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="state" className="text-sm font-medium">
                    State *
                  </Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAGOS">Lagos</SelectItem>
                      <SelectItem value="ABUJA">Abuja</SelectItem>
                      <SelectItem value="KANO">Kano</SelectItem>
                      <SelectItem value="RIVERS">Rivers</SelectItem>
                      <SelectItem value="KADUNA">Kaduna</SelectItem>
                      <SelectItem value="BAUCHI">Bauchi</SelectItem>
                      <SelectItem value="JIGAWA">Jigawa</SelectItem>
                      <SelectItem value="ANAMBRA">Anambra</SelectItem>
                      <SelectItem value="ENUGU">Enugu</SelectItem>
                      <SelectItem value="DELTA">Delta</SelectItem>
                      <SelectItem value="OGUN">Ogun</SelectItem>
                      <SelectItem value="OYO">Oyo</SelectItem>
                      <SelectItem value="OSUN">Osun</SelectItem>
                      <SelectItem value="ONDO">Ondo</SelectItem>
                      <SelectItem value="PLATEAU">Plateau</SelectItem>
                      <SelectItem value="BORNO">Borno</SelectItem>
                      <SelectItem value="ADAMAWA">Adamawa</SelectItem>
                      <SelectItem value="TARABA">Taraba</SelectItem>
                      <SelectItem value="YOBE">Yobe</SelectItem>
                      <SelectItem value="ZAMFARA">Zamfara</SelectItem>
                      <SelectItem value="KEBBI">Kebbi</SelectItem>
                      <SelectItem value="SOKOTO">Sokoto</SelectItem>
                      <SelectItem value="KATSINA">Katsina</SelectItem>
                      <SelectItem value="KOGI">Kogi</SelectItem>
                      <SelectItem value="KWARA">Kwara</SelectItem>
                      <SelectItem value="NASARAWA">Nasarawa</SelectItem>
                      <SelectItem value="NIGER">Niger</SelectItem>
                      <SelectItem value="BENUE">Benue</SelectItem>
                      <SelectItem value="CROSS_RIVER">Cross River</SelectItem>
                      <SelectItem value="AKWA_IBOM">Akwa Ibom</SelectItem>
                      <SelectItem value="BAYELSA">Bayelsa</SelectItem>
                      <SelectItem value="EBONYI">Ebonyi</SelectItem>
                      <SelectItem value="IMO">Imo</SelectItem>
                      <SelectItem value="ABIA">Abia</SelectItem>
                      <SelectItem value="EDO">Edo</SelectItem>
                      <SelectItem value="EKITI">Ekiti</SelectItem>
                      <SelectItem value="GOMBE">Gombe</SelectItem>
                      <SelectItem value="FCT">FCT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Business Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brief description of the business and what they offer..."
                  className="mt-1 min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>

              <div>
                <Label htmlFor="reason" className="text-sm font-medium">
                  Why are you recommending this business?
                </Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  placeholder="Share your experience or reason for recommending this business..."
                  className="mt-1 min-h-[100px]"
                  maxLength={300}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.reason.length}/300 characters
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.businessName || !formData.category || !formData.address || !formData.city || !formData.state}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Submit Recommendation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
