"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PublicNavigation from "@/components/PublicNavigation";
import {
  Star,
  Building2,
  TrendingUp,
  Award,
  ArrowRight,
  MessageSquare,
  Gift,
  CreditCard,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

// Types for our dynamic data
interface FeaturedBusiness {
  id: string;
  name: string;
  description: string | null;
  category: string;
  averageRating: number;
  totalReviews: number;
  totalVisits: number;
  address: string;
  city: string;
  state: string;
  logo: string | null;
  coverImage: string | null;
  _count?: {
    reviews: number;
  };
}

interface Testimonial {
  id: string;
  rating: number;
  content: string;
  reviewer: {
    name: string;
    role: string;
  };
  business: {
    name: string;
    category: string;
  };
}

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<
    FeaturedBusiness[]
  >([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured businesses and testimonials in parallel
        const [businessesResponse, testimonialsResponse] = await Promise.all([
          fetch("/api/businesses/featured"),
          fetch("/api/reviews/testimonials"),
        ]);

        if (businessesResponse.ok) {
          const businessesData = await businessesResponse.json();
          setFeaturedBusinesses(businessesData.businesses || []);
        }

        if (testimonialsResponse.ok) {
          const testimonialsData = await testimonialsResponse.json();
          setTestimonials(testimonialsData.testimonials || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Track business view when card is clicked
  const handleBusinessCardClick = useCallback(async (businessId: string) => {
    try {
      const params = new URLSearchParams({
        source: "FEATURED",
        viewType: "FEATURED_LIST",
      });

      await fetch(
        `/api/businesses/${businessId}/track-view?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      console.warn("Failed to track featured business view:", error);
    }
  }, []);

  // Use dynamic data if available, otherwise fallback
  const displayBusinesses = featuredBusinesses;
  const displayTestimonials = testimonials;

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      RESTAURANT:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      TECHNOLOGY:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      FASHION:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      HEALTHCARE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      EDUCATION:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      ENTERTAINMENT:
        "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      FINANCE:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      REAL_ESTATE:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      AUTOMOTIVE:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      BEAUTY: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
      FITNESS: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
      TRAVEL: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      RETAIL:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[category] || colors.OTHER;
  };

  const getCategoryDisplayName = (category: string) => {
    const names: { [key: string]: string } = {
      RESTAURANT: "Restaurant",
      TECHNOLOGY: "Technology",
      FASHION: "Fashion",
      HEALTHCARE: "Healthcare",
      EDUCATION: "Education",
      ENTERTAINMENT: "Entertainment",
      FINANCE: "Finance",
      REAL_ESTATE: "Real Estate",
      AUTOMOTIVE: "Automotive",
      BEAUTY: "Beauty",
      FITNESS: "Fitness",
      TRAVEL: "Travel",
      RETAIL: "Retail",
      OTHER: "Other",
    };
    return names[category] || category;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <PublicNavigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              Rate. Earn.
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Redeem.
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
              Discover amazing businesses, share your experiences, and earn
              rewards for every review. Join thousands of users building a
              better business ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {status === "loading" ? (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-lg px-8 py-4"
                  disabled
                >
                  Loading...
                </Button>
              ) : session?.user ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4"
                  >
                    Start Earning Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link href="/businesses">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-4 border-2"
                >
                  Explore Businesses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Three simple steps to start earning rewards while helping others
              discover great businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Rate
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Visit businesses and share your honest experiences through
                detailed reviews with photos and videos
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Earn
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get rewarded for every valid review, business recommendation,
                and successful referral
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Redeem
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Convert your earnings into airtime, coupons, and other rewards
                once you reach the minimum threshold
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section id="businesses" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Businesses
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover top-rated businesses in your area and start earning
              rewards
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {[...Array(3)].map((_, i) => (
                <Card
                  key={i}
                  className="animate-pulse bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-20"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {displayBusinesses.map((business) => (
                <Card
                  key={business.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-pointer overflow-hidden"
                  onClick={() => handleBusinessCardClick(business.id)}
                >
                  {/* Business Cover Image */}
                  <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                    {business.coverImage ? (
                      <Image
                        src={business.coverImage}
                        alt={`${business.name} cover`}
                        layout="fill"
                        objectFit="cover"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    {/* Logo Overlay */}
                    <div className="absolute -bottom-8 left-4">
                      <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl border-4 border-white dark:border-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
                        {business.logo ? (
                          <Image
                            src={business.logo}
                            alt={`${business.name} logo`}
                            layout="fill"
                            objectFit="cover"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <CardContent className="pt-12 pb-6 px-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge
                        variant="secondary"
                        className={getCategoryColor(business.category)}
                      >
                        {getCategoryDisplayName(business.category)}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {business.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {business.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {business.description ||
                        "Experience the best service and quality."}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <Building2 className="h-4 w-4 inline mr-1" />
                        {business.city}, {business.state}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {business._count?.reviews || business.totalReviews || 0}{" "}
                        reviews
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link href="/businesses">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 border-2"
              >
                View All Businesses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Screenshots */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              See SnapRate in Action
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience our intuitive interface designed for seamless review
              creation and reward management
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-600 dark:text-blue-400 font-medium">
                    Review Interface
                  </p>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Smart Review Creation
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Easy-to-use forms with photo/video uploads and rating systems
              </p>
            </div>

            <div className="text-center">
              <div className="w-full h-64 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl flex items-center justify-center mb-6 border border-green-200 dark:border-green-800">
                <div className="text-center">
                  <Gift className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    Rewards Dashboard
                  </p>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Track Your Earnings
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Real-time reward tracking and redemption management
              </p>
            </div>

            <div className="text-center">
              <div className="w-full h-64 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-200 dark:border-purple-800">
                <div className="text-center">
                  <CreditCard className="h-16 w-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                  <p className="text-purple-600 dark:text-purple-400 font-medium">
                    Analytics & Insights
                  </p>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Performance Metrics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed analytics on your review performance and earnings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join thousands of satisfied users who are already earning rewards
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <Card
                  key={i}
                  className="animate-pulse bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <div
                          key={j}
                          className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"
                        ></div>
                      ))}
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayTestimonials.map((testimonial) => (
                <Card
                  key={testimonial.id}
                  className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < testimonial.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {testimonial.reviewer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {testimonial.reviewer.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.reviewer.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who are already earning rewards while
            helping others discover great businesses
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {status === "loading" ? (
              <Button
                size="lg"
                className="bg-white text-blue-600 text-lg px-8 py-4"
                disabled
              >
                Loading...
              </Button>
            ) : session?.user ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
                >
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link href="/businesses">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4"
              >
                Explore Businesses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About SnapRate</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We&apos;re building a better business ecosystem through honest
                reviews and meaningful rewards. Join thousands of users who are
                already earning while helping others.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/businesses"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Browse Businesses
                  </Link>
                </li>
                <li>
                  {status === "loading" ? (
                    <span className="text-gray-500">Loading...</span>
                  ) : session?.user ? (
                    <Link
                      href="/dashboard"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/auth/signup"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Get Started
                    </Link>
                  )}
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="#testimonials"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Testimonials
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Legal
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 SnapRate. All rights reserved. Building better businesses
                together.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">Facebook</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.328v15.344C1 18.4 1.595 19 2.328 19h15.34c.734 0 1.332-.6 1.332-1.328V2.328C19 1.581 18.4 1 17.668 1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
