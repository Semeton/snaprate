"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  MessageSquare,
  Star,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreHorizontal,
  Send,
  X,
} from "lucide-react";
import ReviewerSidebar from "@/components/ReviewerSidebar";
import Image from "next/image";

interface ReviewComment {
  id: string;
  content: string;
  authorId: string;
  authorType: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
  isEdited: boolean;
  editedAt: string | null;
  createdAt: string;
  replies: ReviewComment[];
  votes: Array<{
    voteType: string;
    userId: string;
  }>;
}

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
  comments?: ReviewComment[];
  userVote?: string | null;
}

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Comment states
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(
    new Set(),
  );
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [replyText, setReplyText] = useState<{
    [key: string]: string | undefined;
  }>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState<{
    [key: string]: string;
  }>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(
    null,
  );

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
        const reviewsData = data.data?.reviews || [];

        // Fetch comments and votes for each review
        const reviewsWithData = await Promise.all(
          reviewsData.map(async (review: Review) => {
            const [commentsResponse, voteResponse] = await Promise.all([
              fetch(`/api/reviews/${review.id}/comments`),
              fetch(`/api/reviews/${review.id}/vote`),
            ]);

            const comments = commentsResponse.ok
              ? (await commentsResponse.json()).data
              : [];
            const userVote = voteResponse.ok
              ? (await voteResponse.json()).data.voteType
              : null;

            return {
              ...review,
              comments,
              userVote,
            };
          }),
        );

        setReviews(reviewsWithData);
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
        toast({
          title: "Success",
          description: "Review deleted successfully",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete review");
      }
    } catch (error) {
      console.error("Failed to delete review:", error);
      setError("Network error. Please try again.");
    }
  };

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const handleVote = async (
    reviewId: string,
    voteType: "HELPFUL" | "UNHELPFUL",
  ) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteType }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update the review's helpful count and user vote
        setReviews((prev) =>
          prev.map((review) => {
            if (review.id === reviewId) {
              return {
                ...review,
                helpfulCount:
                  review.helpfulCount + (data.data.helpfulCountChange || 0),
                userVote: data.data.voteType,
              };
            }
            return review;
          }),
        );

        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to vote",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to vote:", error);
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (reviewId: string, parentId?: string) => {
    const text = parentId ? replyText[reviewId] : commentText[reviewId];
    if (!text || !text.trim()) return;

    setSubmittingComment(reviewId);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: text.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add the new comment to the review
        setReviews((prev) =>
          prev.map((review) => {
            if (review.id === reviewId) {
              const newComment = data.data;
              if (parentId) {
                // Add reply to existing comment
                const updatedComments =
                  review.comments?.map((comment) => {
                    if (comment.id === parentId) {
                      return {
                        ...comment,
                        replies: [...(comment.replies || []), newComment],
                      };
                    }
                    return comment;
                  }) || [];
                return { ...review, comments: updatedComments };
              } else {
                // Add top-level comment
                return {
                  ...review,
                  comments: [...(review.comments || []), newComment],
                };
              }
            }
            return review;
          }),
        );

        // Clear the input
        if (parentId) {
          setReplyText((prev) => ({ ...prev, [reviewId]: undefined }));
        } else {
          setCommentText((prev) => ({ ...prev, [reviewId]: "" }));
        }

        toast({
          title: "Success",
          description: "Comment added successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add comment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleEditComment = async (reviewId: string, commentId: string) => {
    const text = editCommentText[commentId];
    if (!text || !text.trim()) return;

    try {
      const response = await fetch(
        `/api/reviews/${reviewId}/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: text.trim() }),
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Update the comment in the review
        setReviews((prev) =>
          prev.map((review) => {
            if (review.id === reviewId) {
              const updatedComments =
                review.comments?.map((comment) => {
                  if (comment.id === commentId) {
                    return { ...comment, ...data.data };
                  }
                  // Check replies too
                  const updatedReplies =
                    comment.replies?.map((reply) => {
                      if (reply.id === commentId) {
                        return { ...reply, ...data.data };
                      }
                      return reply;
                    }) || [];
                  return { ...comment, replies: updatedReplies };
                }) || [];
              return { ...review, comments: updatedComments };
            }
            return review;
          }),
        );

        setEditingComment(null);
        setEditCommentText((prev) => ({ ...prev, [commentId]: "" }));

        toast({
          title: "Success",
          description: "Comment updated successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update comment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
      toast({
        title: "Error",
        description: "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (reviewId: string, commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(
        `/api/reviews/${reviewId}/comments/${commentId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        // Remove the comment from the review
        setReviews((prev) =>
          prev.map((review) => {
            if (review.id === reviewId) {
              const updatedComments =
                review.comments?.filter(
                  (comment) => comment.id !== commentId,
                ) || [];
              // Also check replies
              const commentsWithUpdatedReplies = updatedComments.map(
                (comment) => ({
                  ...comment,
                  replies:
                    comment.replies?.filter(
                      (reply) => reply.id !== commentId,
                    ) || [],
                }),
              );
              return { ...review, comments: commentsWithUpdatedReplies };
            }
            return review;
          }),
        );

        toast({
          title: "Success",
          description: "Comment deleted successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete comment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
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

  const renderComment = (
    comment: ReviewComment,
    reviewId: string,
    isReply = false,
  ) => {
    const canEdit =
      comment.authorId === session?.user?.id ||
      ["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role || "");
    const canDelete =
      canEdit ||
      (session?.user?.role === "BUSINESS_OWNER" &&
        comment.authorType === "BUSINESS_OWNER");

    return (
      <div
        key={comment.id}
        className={`${isReply ? "ml-8 border-l-2 border-gray-200 pl-4" : ""}`}
      >
        <div className="flex items-start space-x-3 mb-2">
          <div className="flex-shrink-0">
            {comment.author.avatar ? (
              <Image
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-8 h-8 rounded-full object-cover"
                width={32}
                height={32}
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-xs font-medium">
                  {comment.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium text-gray-900">
                {comment.author.name}
              </span>
              <Badge variant="outline" className="text-xs">
                {comment.authorType === "BUSINESS_OWNER"
                  ? "Business"
                  : comment.authorType === "AGENT"
                  ? "Agent"
                  : "Reviewer"}
              </Badge>
              {comment.isEdited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editCommentText[comment.id] || comment.content}
                  onChange={(e) =>
                    setEditCommentText((prev) => ({
                      ...prev,
                      [comment.id]: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditComment(reviewId, comment.id)}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null);
                      setEditCommentText((prev) => ({
                        ...prev,
                        [comment.id]: "",
                      }));
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
            )}

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{formatDate(comment.createdAt)}</span>
              {!isReply && (
                <button
                  onClick={() =>
                    setReplyText((prev) => ({ ...prev, [reviewId]: "" }))
                  }
                  className="flex items-center space-x-1 hover:text-blue-600"
                >
                  <Reply className="h-3 w-3" />
                  <span>Reply</span>
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => {
                    setEditingComment(comment.id);
                    setEditCommentText((prev) => ({
                      ...prev,
                      [comment.id]: comment.content,
                    }));
                  }}
                  className="flex items-center space-x-1 hover:text-blue-600"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDeleteComment(reviewId, comment.id)}
                  className="flex items-center space-x-1 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply input */}
        {!isReply && replyText[reviewId] !== undefined && (
          <div className="ml-11 mb-3">
            <div className="flex space-x-2">
              <Textarea
                value={replyText[reviewId] || ""}
                onChange={(e) =>
                  setReplyText((prev) => ({
                    ...prev,
                    [reviewId]: e.target.value,
                  }))
                }
                placeholder="Write a reply..."
                className="flex-1 min-h-[80px]"
              />
              <div className="flex flex-col space-y-2">
                <Button
                  size="sm"
                  onClick={() => handleAddComment(reviewId, comment.id)}
                  disabled={submittingComment === reviewId}
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setReplyText((prev) => ({ ...prev, [reviewId]: undefined }))
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            {comment.replies.map((reply) =>
              renderComment(reply, reviewId, true),
            )}
          </div>
        )}
      </div>
    );
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
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
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
                            <Image
                              src={review.business.logo}
                              alt={review.business.name}
                              className="w-12 h-12 rounded-lg object-cover"
                              width={48}
                              height={48}
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
                              <Image
                                key={index}
                                src={image}
                                alt={`Review image ${index + 1}`}
                                className="w-16 h-16 rounded object-cover"
                                width={64}
                                height={64}
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

                      {/* Voting Section */}
                      <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(review.id, "HELPFUL")}
                            className={`${
                              review.userVote === "HELPFUL"
                                ? "text-green-600 bg-green-100"
                                : "text-gray-600 hover:text-green-600"
                            }`}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Helpful ({review.helpfulCount})
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(review.id, "UNHELPFUL")}
                            className={`${
                              review.userVote === "UNHELPFUL"
                                ? "text-red-600 bg-red-100"
                                : "text-gray-600 hover:text-red-600"
                            }`}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Unhelpful
                          </Button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">
                            Comments ({review.comments?.length || 0})
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleReviewExpansion(review.id)}
                          >
                            {expandedReviews.has(review.id) ? "Hide" : "Show"}{" "}
                            Comments
                          </Button>
                        </div>

                        {expandedReviews.has(review.id) && (
                          <div className="space-y-4">
                            {/* Add Comment */}
                            <div className="space-y-2">
                              <Textarea
                                value={commentText[review.id] || ""}
                                onChange={(e) =>
                                  setCommentText((prev) => ({
                                    ...prev,
                                    [review.id]: e.target.value,
                                  }))
                                }
                                placeholder="Add a comment to this review..."
                                className="min-h-[80px]"
                              />
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddComment(review.id)}
                                  disabled={submittingComment === review.id}
                                >
                                  {submittingComment === review.id ? (
                                    <div className="flex items-center space-x-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      <span>Adding...</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <Send className="h-4 w-4" />
                                      <span>Add Comment</span>
                                    </div>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Display Comments */}
                            {review.comments && review.comments.length > 0 ? (
                              <div className="space-y-4">
                                {review.comments.map((comment) =>
                                  renderComment(comment, review.id),
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-4">
                                No comments yet. Be the first to comment!
                              </p>
                            )}
                          </div>
                        )}
                      </div>

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
