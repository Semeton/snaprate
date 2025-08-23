"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Star,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import ReviewerSidebar from "@/components/ReviewerSidebar";

interface Review {
  id: string;
  content: string;
  rating: number;
  images: string[];
  video: string | null;
  status: string;
  isVerified: boolean;
  helpfulCount: number;
  businessResponse: string | null;
  businessResponseDate: string | null;
  createdAt: string;
  business: {
    id: string;
    name: string;
    category: string;
    city: string;
    state: string;
    logo: string | null;
  };
}

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchReviews();
    }
  }, [session, status]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/reviews?limit=50");
      if (response.ok) {
        const data = await response.json();
        setReviews(data.data?.reviews || []);
      } else {
        setError("Failed to load reviews");
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (reviewId: string) => {
    router.push(`/reviewer/edit-review/${reviewId}`);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this review? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the review from the list
        setReviews((prev) => prev.filter((review) => review.id !== reviewId));
      } else {
        setError("Failed to delete review");
      }
    } catch (error) {
      setError("Failed to delete review");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatState = (state: string) => {
    return state.replace(/_/g, " ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ReviewerSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">My Reviews</h1>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Reviews Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
                <p className="text-gray-600">
                  Manage and view all your business reviews
                </p>
              </div>
              <Button
                onClick={() => router.push("/reviewer/submit-review")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Write New Review
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {reviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No reviews yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start reviewing businesses to build your reputation and earn
                  rewards!
                </p>
                <Button
                  onClick={() => router.push("/reviewer/submit-review")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Write Your First Review
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Reviews Stats */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {reviews.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Reviews</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {reviews.filter((r) => r.status === "APPROVED").length}
                      </div>
                      <div className="text-sm text-gray-600">Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {reviews.filter((r) => r.status === "PENDING").length}
                      </div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {reviews.reduce((sum, r) => sum + r.helpfulCount, 0)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total Helpful Votes
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card
                    key={review.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {review.business.logo ? (
                            <img
                              src={review.business.logo}
                              alt={review.business.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500 font-medium text-lg">
                                {review.business.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {review.business.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>{review.business.category}</span>
                              <span>•</span>
                              <MapPin className="h-3 w-3" />
                              <span>
                                {review.business.city},{" "}
                                {formatState(review.business.state)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(review.status)}>
                            {review.status}
                          </Badge>
                          {review.isVerified && (
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-800"
                            >
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center">
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
                        <span className="text-sm text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>

                      {/* Review Content */}
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {review.content}
                      </p>

                      {/* Media */}
                      {(review.images.length > 0 || review.video) && (
                        <div className="mb-4">
                          <div className="flex space-x-2">
                            {review.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Review image ${index + 1}`}
                                className="w-16 h-16 rounded object-cover"
                              />
                            ))}
                            {review.video && (
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-500 text-xs">
                                  Video
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Business Response */}
                      {review.businessResponse && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            Business Response:
                          </p>
                          <p className="text-sm text-blue-800">
                            {review.businessResponse}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            {formatDate(review.businessResponseDate!)}
                          </p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(review.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{review.helpfulCount} helpful</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReview(review.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
