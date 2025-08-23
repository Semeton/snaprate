"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
} from "lucide-react";

interface BusinessDetailModalProps {
  business: any;
  isOpen: boolean;
  onClose: () => void;
  onVerification: (businessId: string, status: "VERIFIED" | "REJECTED") => void;
}

export default function BusinessDetailModal({
  business,
  isOpen,
  onClose,
  onVerification,
}: BusinessDetailModalProps) {
  const [verifying, setVerifying] = useState(false);

  const handleVerification = async (status: "VERIFIED" | "REJECTED") => {
    setVerifying(true);
    try {
      await onVerification(business.id, status);
      onClose();
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!business) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span>{business.name}</span>
            {getStatusBadge(business.verificationStatus)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span>Category: {business.category}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {business.city}, {business.state}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{business.phone}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{business.email}</span>
                  </div>
                  {business.website && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Globe className="h-4 w-4" />
                      <span>{business.website}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Registered:{" "}
                      {new Date(business.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {business.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-gray-600">
                    {business.description}
                  </p>
                </div>
              )}

              {business.address && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Address</h4>
                  <p className="text-sm text-gray-600">{business.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Owner Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {business.owner.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {business.owner.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {business.owner.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Member since{" "}
                    {new Date(business.owner.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {business.totalReviews || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total Reviews</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {business.averageRating
                      ? business.averageRating.toFixed(1)
                      : "0.0"}
                  </div>
                  <div className="text-sm text-green-600">Average Rating</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {business.totalVisits || 0}
                  </div>
                  <div className="text-sm text-purple-600">Total Visits</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Documents */}
          {business.verificationDocuments &&
            business.verificationDocuments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Verification Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {business.verificationDocuments.map(
                      (doc: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 p-3 border rounded-lg"
                        >
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Document {index + 1}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-auto"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Recent Reviews */}
          {business.reviews && business.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {business.reviews.slice(0, 3).map((review: any) => (
                    <div key={review.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">
                            {review.reviewer.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{review.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Actions */}
          {business.verificationStatus === "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verification Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleVerification("VERIFIED")}
                    disabled={verifying}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Business
                  </Button>
                  <Button
                    onClick={() => handleVerification("REJECTED")}
                    disabled={verifying}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Business
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
