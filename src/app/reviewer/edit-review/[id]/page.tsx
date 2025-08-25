"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Star,
  Image as ImageIcon,
  Video,
  Save,
  X,
} from "lucide-react";
import ReviewerSidebar from "@/components/ReviewerSidebar";

interface Review {
  id: string;
  content: string;
  rating: number;
  images: string[];
  video: string | null;
  status: string;
  business: {
    id: string;
    name: string;
    category: string;
    city: string;
    state: string;
  };
}

export default function EditReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    rating: 5,
    content: "",
    images: [] as string[],
    video: "",
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user && reviewId) {
      fetchReview();
    }
  }, [session, status, reviewId]);

  const fetchReview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reviews/${reviewId}`);

      if (response.ok) {
        const data = await response.json();
        const reviewData = data.data;
        setReview(reviewData);
        setFormData({
          rating: reviewData.rating,
          content: reviewData.content,
          images: reviewData.images || [],
          video: reviewData.video || "",
        });
      } else {
        setError("Failed to load review");
      }
    } catch (error) {
      console.error("Failed to fetch review:", error);
      setError("Failed to load review");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeVideo = () => {
    setFormData((prev) => ({ ...prev, video: "" }));
  };

  const validateForm = () => {
    if (!formData.content.trim()) {
      setError("Review content is required");
      return false;
    }
    if (formData.content.length < 10) {
      setError("Review content must be at least 10 characters long");
      return false;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setError("Rating must be between 1 and 5");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess("Review updated successfully!");
        setTimeout(() => {
          router.push("/reviewer/reviews");
        }, 1500);
      } else {
        setError(result.error || "Failed to update review");
      }
    } catch (error) {
      console.error("Failed to update review:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">
            Review Not Found
          </div>
          <p className="text-gray-600 mb-4">
            The review you're looking for doesn't exist or you don't have
            permission to edit it.
          </p>
          <Button onClick={() => router.push("/reviewer/reviews")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Button>
        </div>
      </div>
    );
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
            <h1 className="text-lg font-semibold text-gray-900">Edit Review</h1>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Edit Review Content */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/reviewer/reviews")}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Edit Review
                </h1>
                <p className="text-gray-600">
                  Update your review for {review.business.name}
                </p>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Business Name
                  </Label>
                  <p className="text-gray-900 font-medium">
                    {review.business.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Category
                  </Label>
                  <p className="text-gray-900">{review.business.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Location
                  </Label>
                  <p className="text-gray-900">
                    {review.business.city}, {review.business.state}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle>Review Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Rating *
                  </Label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= formData.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-sm text-gray-600">
                      {formData.rating}/5 stars
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <Label
                    htmlFor="content"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Review Content *
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      handleInputChange("content", e.target.value)
                    }
                    placeholder="Share your experience with this business..."
                    className="min-h-[120px]"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.content.length}/1000 characters (minimum 10)
                  </p>
                </div>

                {/* Current Media */}
                {(formData.images.length > 0 || formData.video) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Current Media
                    </Label>

                    {/* Images */}
                    {formData.images.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Images:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.images.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={image}
                                alt={`Review image ${index + 1}`}
                                className="w-20 h-20 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video */}
                    {formData.video && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Video:</p>
                        <div className="relative inline-block">
                          <div className="w-32 h-24 bg-gray-200 rounded border flex items-center justify-center">
                            <Video className="h-8 w-8 text-gray-500" />
                          </div>
                          <button
                            type="button"
                            onClick={removeVideo}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Alerts */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/reviewer/reviews")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Save className="h-4 w-4" />
                        <span>Update Review</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
