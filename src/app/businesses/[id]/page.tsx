"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/user-avatar";
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

interface Review {
  id: string;
  rating: number;
  content: string;
  images: string[];
  video: string;
  status: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    avatar: string;
  };
}

export default function BusinessViewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const businessId = params.id as string;

  // Track business view
  useBusinessViewTracking({
    businessId,
    onViewTracked: () => {
      console.log("View tracked");
    },
    // source: "DIRECT",
    // autoTrack: true,
    // viewType: "PROFILE",
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
      const response = await fetch(
        `/api/reviews?businessId=${businessId}&limit=10`,
      );
      if (response.ok) {
        const reviewsData = await response.json();
        setReviews(reviewsData.data?.reviews || []);
      } else {
        console.error(
          "Reviews API error:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleAddReview = () => {
    router.push(`/reviewer/submit-review?businessId=${businessId}`);
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
              layout="fill"
              objectFit="cover"
              className="w-full h-full object-cover"
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
                    layout="fill"
                    objectFit="cover"
                    alt={`${business.name} logo`}
                    className="w-full h-full object-cover"
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
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              review.status === "APPROVED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {review.status}
                          </Badge>
                          {review.images && review.images.length > 0 && (
                            <div className="flex space-x-2">
                              {review.images.slice(0, 3).map((image, index) => (
                                <Image
                                  key={index}
                                  src={image}
                                  layout="fill"
                                  objectFit="cover"
                                  alt={`Review image ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded"
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
                      Help others by reviewing this business and earn ₦50!
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
