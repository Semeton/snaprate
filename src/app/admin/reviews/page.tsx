"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import ReviewDetailModal from "@/components/ReviewDetailModal";
import {
  Star,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  MessageSquare,
  Building2,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  content: string;
  images: string[];
  video?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  isVerified: boolean;
  helpfulCount: number;
  businessResponse?: string;
  businessResponseDate?: string;
  createdAt: string;
  business: {
    id: string;
    name: string;
    category: string;
  };
  reviewer: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Review>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [currentPage, filter, searchTerm, sortField, sortDirection]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        filter,
        search: searchTerm,
        sortField,
        sortDirection,
      });

      const response = await fetch(`/api/admin/reviews?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.data);
        setTotalPages(Math.ceil(data.total / pageSize));
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Review) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: keyof Review) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const handleReviewAction = async (
    reviewId: string,
    action: "APPROVE" | "REJECT" | "VERIFY",
  ) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Review ${action.toLowerCase()}d successfully`,
        });
        fetchReviews();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update review",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update review:", error);
      toast({
        title: "Error",
        description: "Failed to update review",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        label: "Pending",
        variant: "outline" as const,
        color: "text-yellow-600",
      },
      APPROVED: {
        label: "Approved",
        variant: "default" as const,
        color: "text-green-600",
      },
      REJECTED: {
        label: "Rejected",
        variant: "destructive" as const,
        color: "text-red-600",
      },
      FLAGGED: {
        label: "Flagged",
        variant: "destructive" as const,
        color: "text-orange-600",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === "PENDING").length,
    approved: reviews.filter((r) => r.status === "APPROVED").length,
    rejected: reviews.filter((r) => r.status === "REJECTED").length,
    flagged: reviews.filter((r) => r.status === "FLAGGED").length,
    verified: reviews.filter((r) => r.isVerified).length,
    averageRating:
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          ).toFixed(1)
        : "0.0",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reviews Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and moderate all platform reviews
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.approved}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.flagged}
            </div>
            <div className="text-sm text-gray-600">Flagged</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.verified}
            </div>
            <div className="text-sm text-gray-600">Verified</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {stats.averageRating}
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label
                htmlFor="search"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Search Reviews
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by content, business name, or reviewer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="status-filter"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Status Filter
              </Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger id="status-filter" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="FLAGGED">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilter("ALL");
                  setCurrentPage(1);
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reviews ({reviews.length})</span>
            <Button onClick={fetchReviews} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("rating")}
                  >
                    <div className="flex items-center">
                      Rating
                      {getSortIcon("rating")}
                    </div>
                  </TableHead>
                  <TableHead>Review Content</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Posted
                      {getSortIcon("createdAt")}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-gray-50">
                    <TableCell>{getRatingStars(review.rating)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="text-sm text-gray-900 line-clamp-3">
                          {review.content}
                        </div>
                        {review.businessResponse && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                            <strong>Business Response:</strong>{" "}
                            {review.businessResponse}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">
                          {review.business.name}
                        </div>
                        <div className="text-gray-500">
                          {review.business.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">
                          {review.reviewer.name}
                        </div>
                        <div className="text-gray-500">
                          {review.reviewer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        {getStatusBadge(review.status)}
                        {review.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {review.images.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span>📷 {review.images.length}</span>
                          </div>
                        )}
                        {review.video && (
                          <div className="flex items-center space-x-1">
                            <span>🎥 Video</span>
                          </div>
                        )}
                        {review.images.length === 0 && !review.video && (
                          <span>Text only</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {review.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                handleReviewAction(review.id, "APPROVE")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleReviewAction(review.id, "REJECT")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {review.status === "APPROVED" && !review.isVerified && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() =>
                              handleReviewAction(review.id, "VERIFY")
                            }
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        {review.status === "FLAGGED" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                handleReviewAction(review.id, "APPROVE")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleReviewAction(review.id, "REJECT")
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {(review.status === "APPROVED" ||
                          review.status === "REJECTED") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // TODO: Implement review details modal
                              toast({
                                title: "Review Details",
                                description: `Review by ${review.reviewer.name} for ${review.business.name}`,
                              });
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        {/* Always show view button for all reviews */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedReview(review);
                            setShowReviewModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {reviews.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No reviews found matching your criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Detail Modal */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReview(null);
          }}
          onAction={handleReviewAction}
        />
      )}
    </div>
  );
}
