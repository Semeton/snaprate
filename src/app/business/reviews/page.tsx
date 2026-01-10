"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole } from "@/types";
import {
  Star,
  Search,
  MessageSquare,
  Reply,
  Image as ImageIcon,
  Video,
  Eye,
  Download,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  content: string;
  images: string[];
  video?: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  isVerified: boolean;
  helpfulCount: number;
  businessResponse?: string;
  businessResponseDate?: string;
  createdAt: string;
  updatedAt: string;
  reviewer: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export default function BusinessReviewsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
      <BusinessReviewsContent />
    </ProtectedRoute>
  );
}

function BusinessReviewsContent() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);

        // Build query parameters for filtering
        const params = new URLSearchParams();
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        // Fetch reviews from the API with filters
        const response = await fetch(
          `/api/business/reviews?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.statusText}`);
        }

        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        // Keep empty array on error
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [statusFilter]);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;

    try {
      // Send reply to the API
      const response = await fetch("/api/business/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId,
          response: replyText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send reply: ${response.statusText}`);
      }

      // Update the local state with the response from the API
      const updatedReviews = reviews.map((review) => {
        if (review.id === reviewId) {
          return {
            ...review,
            businessResponse: replyText,
            businessResponseDate: new Date().toISOString(),
          };
        }
        return review;
      });

      setReviews(updatedReviews);
      setReplyText("");
      setSelectedReview(null);
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      // Build query parameters for filtering
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/business/reviews?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`);
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Failed to refresh reviews:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    // The useEffect will automatically trigger a new fetch when statusFilter changes
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating =
      ratingFilter === "all" || review.rating.toString() === ratingFilter;
    const matchesStatus =
      statusFilter === "all" || review.status === statusFilter;
    return matchesSearch && matchesRating && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default";
      case "PENDING":
        return "secondary";
      case "REJECTED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const totalReviews = reviews.length;
  const verifiedReviews = reviews.filter((review) => review.isVerified).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading reviews...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Customer Reviews
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage and respond to customer feedback
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Reviews
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averageRating.toFixed(1)}/5
              </div>
              <p className="text-xs text-muted-foreground">
                Based on {totalReviews} reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reviews
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews}</div>
              <p className="text-xs text-muted-foreground">
                {verifiedReviews} verified customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Response Rate
              </CardTitle>
              <Reply className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reviews.filter((r) => r.businessResponse).length > 0
                  ? Math.round(
                      (reviews.filter((r) => r.businessResponse).length /
                        totalReviews) *
                        100,
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                Reviews with responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reviews
              </CardTitle>
              <Eye className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reviews.filter((r) => r.status === "PENDING").length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {loading
                  ? "Loading reviews..."
                  : "Your business hasn't received any reviews yet."}
              </p>
              {!loading && (
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Reviewer Info */}
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={review.reviewer.avatar} />
                      <AvatarFallback>
                        {review.reviewer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {review.reviewer.name}
                            </h3>
                            {review.isVerified && (
                              <Badge variant="outline" className="text-xs">
                                Verified Customer
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "text-yellow-500 fill-current"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <span
                              className={`font-medium ${getRatingColor(
                                review.rating,
                              )}`}
                            >
                              {review.rating}/5
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusColor(review.status)}>
                            {review.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Review Content */}
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {review.content}
                      </p>

                      {/* Media */}
                      {(review.images || review.video) && (
                        <div className="flex items-center space-x-2 mb-3">
                          {review.images && review.images.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {review.images.length} photo
                                {review.images.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                          {review.video && (
                            <div className="flex items-center space-x-2">
                              <Video className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Video
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Review Meta */}
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center space-x-4">
                          <span>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{review.helpfulCount} found helpful</span>
                        </div>
                      </div>

                      {/* Business Response */}
                      {review.businessResponse && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                              <span className="text-white text-xs font-bold">
                                B
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Business Response
                              </p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {review.businessResponse}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                                {new Date(
                                  review.businessResponseDate!,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reply Form */}
                      {!review.businessResponse && (
                        <div className="mt-4">
                          {selectedReview?.id === review.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write your response..."
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                              />
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(review.id)}
                                  disabled={!replyText.trim()}
                                >
                                  Send Response
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReview(null);
                                    setReplyText("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReview(review)}
                            >
                              <Reply className="w-4 h-4 mr-2" />
                              Respond to Review
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
