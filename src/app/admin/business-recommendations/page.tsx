"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";

interface BusinessRecommendation {
  id: string;
  businessName: string;
  businessDescription?: string;
  businessCategory: string;
  businessPhone: string;
  businessEmail: string;
  businessWebsite?: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAddress?: string;
  ownerCity?: string;
  ownerState?: string;
  additionalNotes?: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  recommendedByUser: {
    name: string;
    email: string;
  };
}

interface CreateBusinessFormData {
  businessName: string;
  businessDescription: string;
  businessCategory: string;
  businessPhone: string;
  businessEmail: string;
  businessWebsite: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAddress: string;
  ownerCity: string;
  ownerState: string;
}

export default function BusinessRecommendationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<
    BusinessRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<BusinessRecommendation | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateBusinessFormData>({
    businessName: "",
    businessDescription: "",
    businessCategory: "",
    businessPhone: "",
    businessEmail: "",
    businessWebsite: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerAddress: "",
    ownerCity: "",
    ownerState: "",
  });

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/business-recommendations");
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch business recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async () => {
    try {
      setCreating(true);

      const response = await fetch(
        "/api/admin/businesses/create-from-recommendation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recommendationId: selectedRecommendation?.id || null,
            businessData: {
              name: formData.businessName,
              description: formData.businessDescription,
              category: formData.businessCategory,
              phone: formData.businessPhone,
              email: formData.businessEmail,
              website: formData.businessWebsite,
              address: formData.businessAddress,
              city: formData.businessCity,
              state: formData.businessState,
            },
            ownerData: {
              name: formData.ownerName,
              email: formData.ownerEmail,
              phone: formData.ownerPhone,
              address: formData.ownerAddress,
              city: formData.ownerCity,
              state: formData.ownerState,
            },
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
        setShowCreateDialog(false);
        setSelectedRecommendation(null);
        // Refresh recommendations if we created from one, otherwise just close
        if (selectedRecommendation) {
          fetchRecommendations();
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create business",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create business:", error);
      toast({
        title: "Error",
        description: "Failed to create business",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const openCreateDialog = (recommendation: BusinessRecommendation) => {
    setSelectedRecommendation(recommendation);
    setFormData({
      businessName: recommendation.businessName,
      businessDescription: recommendation.businessDescription || "",
      businessCategory: recommendation.businessCategory,
      businessPhone: recommendation.businessPhone,
      businessEmail: recommendation.businessEmail,
      businessWebsite: recommendation.businessWebsite || "",
      businessAddress: recommendation.businessAddress,
      businessCity: recommendation.businessCity,
      businessState: recommendation.businessState,
      ownerName: recommendation.ownerName,
      ownerEmail: recommendation.ownerEmail,
      ownerPhone: recommendation.ownerPhone,
      ownerAddress: recommendation.ownerAddress || "",
      ownerCity: recommendation.ownerCity || "",
      ownerState: recommendation.ownerState || "",
    });
    setShowCreateDialog(true);
  };

  const openDetailsDialog = (recommendation: BusinessRecommendation) => {
    setSelectedRecommendation(recommendation);
    setShowDetailsDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading business recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Business Recommendations
              </h1>
              <p className="text-gray-600">
                Manage business recommendations submitted by agents
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedRecommendation(null);
                setFormData({
                  businessName: "",
                  businessDescription: "",
                  businessCategory: "",
                  businessPhone: "",
                  businessEmail: "",
                  businessWebsite: "",
                  businessAddress: "",
                  businessCity: "",
                  businessState: "",
                  ownerName: "",
                  ownerEmail: "",
                  ownerPhone: "",
                  ownerAddress: "",
                  ownerCity: "",
                  ownerState: "",
                });
                setShowCreateDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Business Directly
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span>Pending Review</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">
                {recommendations.filter((r) => r.status === "PENDING").length}
              </p>
              <p className="text-sm text-gray-600">Awaiting admin review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Approved</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {recommendations.filter((r) => r.status === "APPROVED").length}
              </p>
              <p className="text-sm text-gray-600">Successfully processed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>This Month</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {
                  recommendations.filter((r) => {
                    const createdAt = new Date(r.createdAt);
                    const now = new Date();
                    return (
                      createdAt.getMonth() === now.getMonth() &&
                      createdAt.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </p>
              <p className="text-sm text-gray-600">New recommendations</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No business recommendations found
                  </p>
                </div>
              ) : (
                recommendations.map((recommendation) => (
                  <div
                    key={recommendation.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {recommendation.businessName}
                          </h3>
                          {getStatusBadge(recommendation.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Building2 className="h-4 w-4" />
                              <span className="font-medium">Category:</span>
                              <span>
                                {getCategoryLabel(
                                  recommendation.businessCategory,
                                )}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span className="font-medium">Location:</span>
                              <span>
                                {recommendation.businessCity},{" "}
                                {recommendation.businessState}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span className="font-medium">Phone:</span>
                              <span>{recommendation.businessPhone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span className="font-medium">Email:</span>
                              <span>{recommendation.businessEmail}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <User className="h-4 w-4" />
                              <span className="font-medium">Owner:</span>
                              <span>{recommendation.ownerName}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span className="font-medium">Owner Email:</span>
                              <span>{recommendation.ownerEmail}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span className="font-medium">Owner Phone:</span>
                              <span>{recommendation.ownerPhone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Shield className="h-4 w-4" />
                              <span className="font-medium">
                                Recommended by:
                              </span>
                              <span>
                                {recommendation.recommendedByUser.name}
                              </span>
                            </div>
                          </div>
                        </div>

                        {recommendation.businessDescription && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Description:</span>{" "}
                              {recommendation.businessDescription}
                            </p>
                          </div>
                        )}

                        {recommendation.additionalNotes && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">
                                Additional Notes:
                              </span>{" "}
                              {recommendation.additionalNotes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Submitted:{" "}
                            {new Date(
                              recommendation.createdAt,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        {recommendation.status === "PENDING" && (
                          <Button
                            onClick={() => openCreateDialog(recommendation)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Business
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsDialog(recommendation)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Business Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRecommendation
                ? "Create Business from Recommendation"
                : "Create Business Directly"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Business Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Business Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessCategory">Category *</Label>
                  <Select
                    value={formData.businessCategory}
                    onValueChange={(value) =>
                      setFormData({ ...formData, businessCategory: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                      <SelectItem value="RETAIL">Retail</SelectItem>
                      <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                      <SelectItem value="EDUCATION">Education</SelectItem>
                      <SelectItem value="ENTERTAINMENT">
                        Entertainment
                      </SelectItem>
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
                  <Label htmlFor="businessPhone">Phone *</Label>
                  <Input
                    id="businessPhone"
                    value={formData.businessPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessPhone: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessEmail">Email *</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessEmail: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessWebsite">Website</Label>
                  <Input
                    id="businessWebsite"
                    value={formData.businessWebsite}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessWebsite: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="businessAddress">Address *</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessAddress: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessCity">City *</Label>
                  <Input
                    id="businessCity"
                    value={formData.businessCity}
                    onChange={(e) =>
                      setFormData({ ...formData, businessCity: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessState">State *</Label>
                  <Select
                    value={formData.businessState}
                    onValueChange={(value) =>
                      setFormData({ ...formData, businessState: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAGOS">Lagos</SelectItem>
                      <SelectItem value="ABUJA">Abuja</SelectItem>
                      <SelectItem value="KANO">Kano</SelectItem>
                      <SelectItem value="RIVERS">Rivers</SelectItem>
                      <SelectItem value="KADUNA">Kaduna</SelectItem>
                      <SelectItem value="BAUCHI">Bauchi</SelectItem>
                      <SelectItem value="BORNO">Borno</SelectItem>
                      <SelectItem value="ANAMBRA">Anambra</SelectItem>
                      <SelectItem value="ENUGU">Enugu</SelectItem>
                      <SelectItem value="IMO">Imo</SelectItem>
                      <SelectItem value="OYO">Oyo</SelectItem>
                      <SelectItem value="OSUN">Osun</SelectItem>
                      <SelectItem value="ONDO">Ondo</SelectItem>
                      <SelectItem value="OGUN">Ogun</SelectItem>
                      <SelectItem value="EDO">Edo</SelectItem>
                      <SelectItem value="DELTA">Delta</SelectItem>
                      <SelectItem value="CROSS_RIVER">Cross River</SelectItem>
                      <SelectItem value="AKWA_IBOM">Akwa Ibom</SelectItem>
                      <SelectItem value="BAYELSA">Bayelsa</SelectItem>
                      <SelectItem value="EBONYI">Ebonyi</SelectItem>
                      <SelectItem value="ABIA">Abia</SelectItem>
                      <SelectItem value="ADAMAWA">Adamawa</SelectItem>
                      <SelectItem value="BENUE">Benue</SelectItem>
                      <SelectItem value="GOMBE">Gombe</SelectItem>
                      <SelectItem value="JIGAWA">Jigawa</SelectItem>
                      <SelectItem value="KATSINA">Katsina</SelectItem>
                      <SelectItem value="KEBBI">Kebbi</SelectItem>
                      <SelectItem value="KOGI">Kogi</SelectItem>
                      <SelectItem value="KWARA">Kwara</SelectItem>
                      <SelectItem value="NASARAWA">Nasarawa</SelectItem>
                      <SelectItem value="NIGER">Niger</SelectItem>
                      <SelectItem value="PLATEAU">Plateau</SelectItem>
                      <SelectItem value="SOKOTO">Sokoto</SelectItem>
                      <SelectItem value="ZAMFARA">Zamfara</SelectItem>
                      <SelectItem value="YOBE">Yobe</SelectItem>
                      <SelectItem value="TARABA">Taraba</SelectItem>
                      <SelectItem value="FCT">FCT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="businessDescription">Description</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessDescription: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>

            {/* Owner Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Owner Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerName: e.target.value })
                    }
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
                      setFormData({ ...formData, ownerEmail: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ownerPhone">Owner Phone *</Label>
                  <Input
                    id="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerPhone: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ownerAddress">Owner Address</Label>
                  <Input
                    id="ownerAddress"
                    value={formData.ownerAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerAddress: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="ownerCity">Owner City</Label>
                  <Input
                    id="ownerCity"
                    value={formData.ownerCity}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerCity: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="ownerState">Owner State</Label>
                  <Select
                    value={formData.ownerState}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ownerState: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAGOS">Lagos</SelectItem>
                      <SelectItem value="ABUJA">Abuja</SelectItem>
                      <SelectItem value="KANO">Kano</SelectItem>
                      <SelectItem value="RIVERS">Rivers</SelectItem>
                      <SelectItem value="KADUNA">Kaduna</SelectItem>
                      <SelectItem value="BAUCHI">Bauchi</SelectItem>
                      <SelectItem value="BORNO">Borno</SelectItem>
                      <SelectItem value="ANAMBRA">Anambra</SelectItem>
                      <SelectItem value="ENUGU">Enugu</SelectItem>
                      <SelectItem value="IMO">Imo</SelectItem>
                      <SelectItem value="OYO">Oyo</SelectItem>
                      <SelectItem value="OSUN">Osun</SelectItem>
                      <SelectItem value="ONDO">Ondo</SelectItem>
                      <SelectItem value="OGUN">Ogun</SelectItem>
                      <SelectItem value="EDO">Edo</SelectItem>
                      <SelectItem value="DELTA">Delta</SelectItem>
                      <SelectItem value="CROSS_RIVER">Cross River</SelectItem>
                      <SelectItem value="AKWA_IBOM">Akwa Ibom</SelectItem>
                      <SelectItem value="BAYELSA">Bayelsa</SelectItem>
                      <SelectItem value="EBONYI">Ebonyi</SelectItem>
                      <SelectItem value="ABIA">Abia</SelectItem>
                      <SelectItem value="ADAMAWA">Adamawa</SelectItem>
                      <SelectItem value="BENUE">Benue</SelectItem>
                      <SelectItem value="GOMBE">Gombe</SelectItem>
                      <SelectItem value="JIGAWA">Jigawa</SelectItem>
                      <SelectItem value="KATSINA">Katsina</SelectItem>
                      <SelectItem value="KEBBI">Kebbi</SelectItem>
                      <SelectItem value="KOGI">Kogi</SelectItem>
                      <SelectItem value="KWARA">Kwara</SelectItem>
                      <SelectItem value="NASARAWA">Nasarawa</SelectItem>
                      <SelectItem value="NIGER">Niger</SelectItem>
                      <SelectItem value="PLATEAU">Plateau</SelectItem>
                      <SelectItem value="SOKOTO">Sokoto</SelectItem>
                      <SelectItem value="ZAMFARA">Zamfara</SelectItem>
                      <SelectItem value="YOBE">Yobe</SelectItem>
                      <SelectItem value="TARABA">Taraba</SelectItem>
                      <SelectItem value="FCT">FCT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">What happens next?</p>
                  <ul className="mt-2 space-y-1">
                    <li>• A business owner account will be created</li>
                    <li>• An invitation email will be sent to the owner</li>
                    <li>
                      • The owner will create their password and complete setup
                    </li>
                    <li>• The business will be automatically approved</li>
                    {!selectedRecommendation && (
                      <li>
                        • This business will be created directly (not from a
                        recommendation)
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBusiness}
                disabled={creating}
                className="bg-green-600 hover:bg-green-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Business & Send Invitation
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Business Recommendation Details</DialogTitle>
          </DialogHeader>

          {selectedRecommendation && (
            <div className="space-y-6">
              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Business Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Business Name
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.businessName}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Category
                    </Label>
                    <p className="text-gray-900">
                      {getCategoryLabel(
                        selectedRecommendation.businessCategory,
                      )}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Phone
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.businessPhone}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Email
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.businessEmail}
                    </p>
                  </div>

                  {selectedRecommendation.businessWebsite && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Website
                      </Label>
                      <p className="text-gray-900">
                        {selectedRecommendation.businessWebsite}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Address
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.businessAddress}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      City
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.businessCity}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      State
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.businessState}
                    </p>
                  </div>
                </div>

                {selectedRecommendation.businessDescription && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-600">
                      Description
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.businessDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* Owner Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Owner Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Owner Name
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.ownerName}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Owner Email
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.ownerEmail}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Owner Phone
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.ownerPhone}
                    </p>
                  </div>

                  {selectedRecommendation.ownerAddress && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Owner Address
                      </Label>
                      <p className="text-gray-900">
                        {selectedRecommendation.ownerAddress}
                      </p>
                    </div>
                  )}

                  {selectedRecommendation.ownerCity && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Owner City
                      </Label>
                      <p className="text-gray-900">
                        {selectedRecommendation.ownerCity}
                      </p>
                    </div>
                  )}

                  {selectedRecommendation.ownerState && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Owner State
                      </Label>
                      <p className="text-gray-900">
                        {selectedRecommendation.ownerState}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Additional Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Status
                    </Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedRecommendation.status)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Recommended by
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.recommendedByUser.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedRecommendation.recommendedByUser.email}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Submitted
                    </Label>
                    <p className="text-gray-900">
                      {new Date(
                        selectedRecommendation.createdAt,
                      ).toLocaleString()}
                    </p>
                  </div>

                  {selectedRecommendation.reviewedAt && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Reviewed
                      </Label>
                      <p className="text-gray-900">
                        {new Date(
                          selectedRecommendation.reviewedAt,
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {selectedRecommendation.additionalNotes && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-600">
                      Additional Notes
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.additionalNotes}
                    </p>
                  </div>
                )}

                {selectedRecommendation.adminNotes && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-600">
                      Admin Notes
                    </Label>
                    <p className="text-gray-900">
                      {selectedRecommendation.adminNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>

                {selectedRecommendation.status === "PENDING" && (
                  <Button
                    onClick={() => {
                      setShowDetailsDialog(false);
                      openCreateDialog(selectedRecommendation);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Business
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
