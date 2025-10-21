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
import {
  Star,
  Building2,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Shield,
  Image as ImageIcon,
  Video,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import { Review } from "@/types";

interface ReviewDetailModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onAction: (reviewId: string, action: "APPROVE" | "REJECT" | "VERIFY") => void;
}

export default function ReviewDetailModal({
  review,
  isOpen,
  onClose,
  onAction,
}: ReviewDetailModalProps) {
  const [processing, setProcessing] = useState(false);

  const handleAction = async (action: "APPROVE" | "REJECT" | "VERIFY") => {
    setProcessing(true);
    try {
      await onAction(review.id, action);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "FLAGGED":
        return <Badge className="bg-orange-100 text-orange-800">Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVerificationBadge = (isVerified: boolean) => {
    if (isVerified) {
      return <Badge className="bg-blue-100 text-blue-800">Verified</Badge>;
    }
    return <Badge variant="outline">Not Verified</Badge>;
  };

  if (!review) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <span>Review Details</span>
            {getStatusBadge(review.status)}
            {review.status === "APPROVED" &&
              getVerificationBadge(review.isVerified)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Review Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rating */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.rating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-medium text-gray-900">
                  {review.rating}/5
                </span>
              </div>

              {/* Review Text */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Review Text</h4>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {review.content}
                </p>
              </div>

              {/* Media */}
              {(review.images && review.images.length > 0) || review.video ? (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Media</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {review.images &&
                      review.images.map((image: string, index: number) => (
                        <div key={index} className="relative">
                          <Image
                            src={image}
                            alt={`Review image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                            width={100}
                            height={100}
                          />
                          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            <ImageIcon className="h-3 w-3 inline mr-1" />
                            Image {index + 1}
                          </div>
                        </div>
                      ))}
                    {review.video && (
                      <div className="relative">
                        <video
                          src={review.video}
                          className="w-full h-32 object-cover rounded-lg border"
                          controls
                        />
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          <Video className="h-3 w-3 inline mr-1" />
                          Video
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Engagement */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{review.helpfulCount || 0} helpful</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Posted {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {review.business.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {review.business.category}
                  </p>
                  <p className="text-xs text-gray-500">
                    Business ID: {review.business.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviewer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reviewer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {review.reviewer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {review.reviewer.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {review.reviewer.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    User ID: {review.reviewer.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Response */}
          {review.businessResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-800">{review.businessResponse}</p>
                  {review.businessResponseDate && (
                    <p className="text-xs text-gray-600 mt-2">
                      Responded on{" "}
                      {new Date(
                        review.businessResponseDate,
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {review.status === "PENDING" && (
                  <>
                    <Button
                      onClick={() => handleAction("APPROVE")}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Review
                    </Button>
                    <Button
                      onClick={() => handleAction("REJECT")}
                      disabled={processing}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Review
                    </Button>
                  </>
                )}

                {review.status === "APPROVED" && !review.isVerified && (
                  <Button
                    onClick={() => handleAction("VERIFY")}
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Verify Review
                  </Button>
                )}

                {review.status === "APPROVED" && review.isVerified && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Review is verified</span>
                  </div>
                )}

                {review.status === "REJECTED" && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Review was rejected</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
