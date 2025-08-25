"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/user-avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessViewTracking } from "@/hooks/useBusinessViewTracking";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Plus,
  Building2,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Send,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import { BusinessCategory, State } from "@/types";
import Image from "next/image";

interface Business {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  phone: string;
  email: string;
  website: string;
  logo: string;
  coverImage: string;
  address: string;
  city: string;
  state: State;
  averageRating: number;
  totalReviews: number;
  totalVisits: number;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

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
  rating: number;
  content: string;
  images: string[];
  video: string;
  status: string;
  helpfulCount: number;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    avatar: string;
  };
  comments: ReviewComment[];
  votes: Array<{
    voteType: string;
    userId: string;
  }>;
  userVote?: string | null;
}

export default function BusinessViewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Comment and interaction states
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

  const businessId = params.id as string;

  // Track business view
  useBusinessViewTracking({
    businessId,
    source: "DIRECT",
    viewType: "PROFILE",
    autoTrack: true,
  });

  useEffect(() => {
    if (businessId) {
      fetchBusinessDetails();
      fetchBusinessReviews();
    }
  }, [businessId]);

  const fetchBusinessDetails = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}`);
      if (response.ok) {
        const businessData = await response.json();
        setBusiness(businessData);
      } else {
        setError("Failed to load business details");
      }
    } catch (error) {
      console.error("Error fetching business:", error);
      setError("Failed to load business details");
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessReviews = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        const reviewsData = data.data || [];

        // Fetch user votes for each review if user is logged in
        if (session?.user) {
          const reviewsWithVotes = await Promise.all(
            reviewsData.map(async (review: Review) => {
              try {
                const voteResponse = await fetch(
                  `/api/reviews/${review.id}/vote`,
                );
                const userVote = voteResponse.ok
                  ? (await voteResponse.json()).data.voteType
                  : null;
                return { ...review, userVote };
              } catch (error) {
                console.error("Failed to fetch user vote:", error);
                return { ...review, userVote: null };
              }
            }),
          );
          setReviews(reviewsWithVotes);
        } else {
          setReviews(reviewsData);
        }
      } else {
        setError("Failed to load reviews");
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setError("Failed to load reviews");
    }
  };

  const handleAddReview = () => {
    router.push(`/reviewer/submit-review?businessId=${businessId}`);
  };

  const handleVote = async (
    reviewId: string,
    voteType: "HELPFUL" | "UNHELPFUL",
  ) => {
    if (!session?.user) {
      // For now, just log - we'll add toast notifications later
      console.log("Authentication required for voting");
      return;
    }

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

        console.log("Vote successful:", data.message);
      } else {
        const errorData = await response.json();
        console.error("Vote failed:", errorData.error || "Failed to vote");
      }
    } catch (error) {
      console.error("Failed to vote:", error);
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

  const handleAddComment = async (reviewId: string, parentId?: string) => {
    if (!session?.user) {
      console.log("Authentication required for commenting");
      return;
    }

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

        console.log("Comment added successfully");
      } else {
        const errorData = await response.json();
        console.error(
          "Failed to add comment:",
          errorData.error || "Failed to add comment",
        );
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
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

        console.log("Comment updated successfully");
      } else {
        const errorData = await response.json();
        console.error(
          "Failed to update comment:",
          errorData.error || "Failed to update comment",
        );
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
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
              return { ...review, comments: updatedComments };
            }
            return review;
          }),
        );

        console.log("Comment deleted successfully");
      } else {
        const errorData = await response.json();
        console.error(
          "Failed to delete comment:",
          errorData.error || "Failed to delete comment",
        );
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
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
              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
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

  const formatCategory = (category: string) => {
    return category.replace(/_/g, " ");
  };

  const formatState = (state: string) => {
    return state.replace(/_/g, " ");
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">
            Business Not Found
          </div>
          <p className="text-gray-600 mb-4">
            {error || "The business you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Cover Image */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 md:h-80 bg-gradient-to-r from-blue-500 to-purple-600">
          {business.coverImage ? (
            <Image
              src={business.coverImage}
              alt={`${business.name} cover`}
              className="w-full h-full object-cover"
              width={1000}
              height={1000}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-24 h-24 text-white opacity-50" />
            </div>
          )}
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>

        {/* Business Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-end space-x-6">
              {/* Logo */}
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-gray-800 rounded-2xl border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center overflow-hidden">
                {business.logo ? (
                  <Image
                    src={business.logo}
                    alt={`${business.name} logo`}
                    className="w-full h-full object-cover"
                    width={1000}
                    height={1000}
                  />
                ) : (
                  <Building2 className="w-12 h-12 md:w-16 md:h-16 text-gray-400" />
                )}
              </div>

              {/* Business Details */}
              <div className="flex-1 text-white">
                <div className="flex items-center space-x-4 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {business.name}
                  </h1>
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30"
                  >
                    {formatCategory(business.category)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-medium">
                      {business.averageRating.toFixed(1)}
                    </span>
                    <span className="opacity-80">
                      ({reviews.length} reviews)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {business.city}, {formatState(business.state)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="text-white hover:bg-white/20 border-white/30"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
                {session?.user && (
                  <Button
                    onClick={handleAddReview}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Business Information</span>
                  <Badge variant="secondary">
                    {formatCategory(business.category)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-600">{business.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Address</p>
                      <p className="text-gray-600">
                        {business.address}, {business.city},{" "}
                        {formatState(business.state)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <p className="text-gray-600">{business.phone}</p>
                    </div>
                  </div>

                  {business.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-gray-600">{business.email}</p>
                      </div>
                    </div>
                  )}

                  {business.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Website</p>
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {business.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Reviews ({reviews.length})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span
                      className={`font-bold ${getRatingColor(
                        business.averageRating,
                      )}`}
                    >
                      {business.averageRating.toFixed(1)}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar
                              user={{
                                name: review.reviewer.name,
                                avatar: review.reviewer.avatar,
                              }}
                              size="md"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {review.reviewer.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  review.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
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
                        </div>
                        <p className="text-gray-700 mb-3">{review.content}</p>

                        {/* Media */}
                        {review.images && review.images.length > 0 && (
                          <div className="mb-4">
                            <div className="flex space-x-2">
                              {review.images.slice(0, 3).map((image, index) => (
                                <Image
                                  key={index}
                                  src={image}
                                  alt={`Review image ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded"
                                  width={64}
                                  height={64}
                                />
                              ))}
                              {review.images.length > 3 && (
                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                  <span className="text-gray-500 text-sm">
                                    +{review.images.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="flex justify-end">
                          <Badge
                            variant={
                              review.status === "APPROVED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {review.status}
                          </Badge>
                        </div>

                        {/* Voting Section */}
                        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
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
                              Helpful ({review.helpfulCount || 0})
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
                              {session?.user && (
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
                                      onClick={() =>
                                        handleAddComment(review.id)
                                      }
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
                              )}

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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No reviews yet. Be the first to review this business!</p>
                    {session?.user && (
                      <Button
                        onClick={handleAddReview}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Write First Review
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Business Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span
                      className={`font-bold ${getRatingColor(
                        business.averageRating,
                      )}`}
                    >
                      {business.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reviews</span>
                  <span className="font-medium">{reviews.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Visits</span>
                  <span className="font-medium">{business.totalVisits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {new Date(business.createdAt).getFullYear()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle>Business Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 font-medium">
                      {business.owner.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {business.owner.name}
                    </p>
                    <p className="text-sm text-gray-500">Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            {session?.user && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Share Your Experience
                    </h3>
                    <p className="text-blue-700 text-sm mb-4">
                      Help others by reviewing this business and earn a cash
                      reward!
                    </p>
                    <Button
                      onClick={handleAddReview}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Write Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
