"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, Camera, Video, Upload, X, ArrowLeft } from "lucide-react";
import Image from "next/image";

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
}

export default function SubmitReview() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("businessId");

  const [business, setBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    businessId || "",
  );
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (businessId) {
      fetchBusinessDetails();
    } else {
      fetchBusinesses();
    }
  }, [businessId]);

  useEffect(() => {
    if (selectedBusinessId && selectedBusinessId !== businessId) {
      fetchBusinessDetails();
    }
  }, [selectedBusinessId]);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("/api/dashboard/businesses?limit=50");
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.data.businesses || []);
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
    }
  };

  const fetchBusinessDetails = async () => {
    try {
      const response = await fetch(`/api/businesses/${selectedBusinessId}`);
      if (response.ok) {
        const businessData = await response.json();
        setBusiness(businessData);
      }
    } catch (error) {
      console.error("Failed to fetch business details:", error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (images.length + imageFiles.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }

    setImages((prev) => [...prev, ...imageFiles]);
    setError("");
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        setError("Video must be less than 50MB");
        return;
      }
      setVideo(file);
      setError("");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBusinessId || !rating || !content.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (content.trim().length < 10) {
      setError("Review content must be at least 10 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload images first
      const imageUrls: string[] = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append("files", image);
        formData.append("type", "image");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const { data } = await uploadResponse.json();
          if (data.files && data.files.length > 0) {
            imageUrls.push(data.files[0]);
          } else {
            console.error("Upload response missing files:", data);
            setError("Failed to upload image: Invalid response");
            return;
          }
        } else {
          const errorData = await uploadResponse.json();
          setError(
            `Failed to upload image: ${errorData.error || "Upload failed"}`,
          );
          return;
        }
      }

      // Upload video if present
      let videoUrl: string | null = null;
      if (video) {
        const formData = new FormData();
        formData.append("files", video);
        formData.append("type", "video");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const { data } = await uploadResponse.json();
          if (data.files && data.files.length > 0) {
            videoUrl = data.files[0];
          } else {
            console.error("Upload response missing files:", data);
            setError("Failed to upload video: Invalid response");
            return;
          }
        } else {
          const errorData = await uploadResponse.json();
          setError(
            `Failed to upload video: ${errorData.error || "Upload failed"}`,
          );
          return;
        }
      }

      // Submit review
      const reviewData = {
        businessId: selectedBusinessId,
        rating,
        content: content.trim(),
        images: imageUrls,
        video: videoUrl,
        isAnonymous,
      };

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        setSuccess("Review submitted successfully! You've earned a reward.");
        setTimeout(() => {
          router.push("/reviewer/dashboard");
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit review");
      }
    } catch (error) {
      setError("An error occurred while submitting the review");
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
              <h1 className="text-2xl font-bold text-gray-900">
                Submit Review
              </h1>
              <p className="text-gray-600">
                Share your experience and earn ₦50
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Info */}
        {business && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Business Name
                  </Label>
                  <p className="text-lg font-semibold">{business.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Category
                  </Label>
                  <Badge variant="secondary">
                    {business.category.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Address
                  </Label>
                  <p className="text-gray-600">
                    {business.address}, {business.city}, {business.state}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Form */}
        <Card>
          <CardHeader>
            <CardTitle>Write Your Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Selection */}
              {!businessId && (
                <div>
                  <Label htmlFor="business" className="text-sm font-medium">
                    Select Business *
                  </Label>
                  <Select
                    value={selectedBusinessId}
                    onValueChange={setSelectedBusinessId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a business to review" />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name} -{" "}
                          {business.category.replace(/_/g, " ")} (
                          {business.city}, {business.state})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Select the business you want to review
                  </p>
                </div>
              )}

              {/* Rating */}
              <div>
                <Label className="text-sm font-medium">Rating *</Label>
                <div className="flex items-center space-x-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Click on the stars to rate this business
                </p>
              </div>

              {/* Review Content */}
              <div>
                <Label htmlFor="content" className="text-sm font-medium">
                  Review Content *
                </Label>
                <Textarea
                  id="content"
                  placeholder="Share your experience with this business... (minimum 10 characters)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 min-h-[120px]"
                  maxLength={1000}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>{content.length}/1000 characters</span>
                  <span className={content.length < 10 ? "text-red-500" : ""}>
                    Minimum 10 characters required
                  </span>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label className="text-sm font-medium">
                  Upload Images (Optional)
                </Label>
                <p className="text-sm text-gray-500 mb-2">
                  Add photos to support your review. Maximum 5 images.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                        width={100}
                        height={100}
                        unoptimized
                        priority
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
                  {images.length < 5 && (
                    <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                      <Camera className="h-6 w-6 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Add Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Video Upload */}
              <div>
                <Label className="text-sm font-medium">
                  Upload Video (Optional)
                </Label>
                <p className="text-sm text-gray-500 mb-2">
                  Add a video review. Maximum 50MB.
                </p>
                {video ? (
                  <div className="relative">
                    <video
                      src={URL.createObjectURL(video)}
                      controls
                      className="w-full max-w-md rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                    <Video className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Add Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center space-x-2 hidden">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Submit anonymously
                </Label>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500 bg-green-50">
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
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
                  disabled={loading || !rating || content.trim().length < 10}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Review
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
