"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Star,
  Users,
  TrendingUp,
  Award,
  MapPin,
  Building2,
  Bus,
  Utensils,
} from "lucide-react";
import {
  PlatformStatsService,
  PlatformStats,
} from "@/services/PlatformStatsService";

export default function HomePageContent() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsService = new PlatformStatsService();
        const platformStats = await statsService.getPlatformStats();
        setStats(platformStats);
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with Theme Toggle */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="max-w-7xl mx-auto flex justify-end">
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-gray-900 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Review Businesses.{" "}
              <span className="text-blue-600 dark:text-blue-400">
                Earn Money.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Join thousands of Nigerians who are earning rewards by sharing
              authentic reviews of businesses. Get paid for your honest feedback
              and help others make informed decisions.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/signup">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg">
                  Get Started - It&apos;s Free
                </button>
              </Link>
              <Link href="/businesses">
                <button className="border-2 border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg text-lg">
                  Explore Businesses
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Three simple steps to start earning rewards
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Star className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Rate & Review
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Visit businesses and share your honest experience with photos,
                videos, and detailed feedback.
              </p>
            </div>

            <div className="text-center border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Earn Rewards
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Get NGN 50 for each approved review, NGN 100 for business
                recommendations, and NGN 20 for referrals.
              </p>
            </div>

            <div className="text-center border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Redeem & Grow
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Convert your earnings to airtime, coupons, or cash. Build your
                reputation and unlock higher rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Popular Business Categories
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Start reviewing businesses in these high-demand categories
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                <Utensils className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Hospitality
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Hotels, Restaurants & Eateries
              </p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                High Demand
              </span>
            </div>

            <div className="text-center border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Bus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Transport
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Buses, Airlines & Logistics
              </p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                Growing
              </span>
            </div>

            <div className="text-center border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Building2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Retail
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Shops, Malls & Markets
              </p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                Popular
              </span>
            </div>

            <div className="text-center border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <MapPin className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Healthcare
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Hospitals, Clinics & Pharmacies
              </p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                Essential
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Platform Impact
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              See how SnapRate is transforming business reviews in Nigeria
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">
                {loading ? "..." : stats?.totalUsers.toLocaleString() || "0"}
              </div>
              <div className="mt-2 text-blue-100">Active Reviewers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">
                {loading
                  ? "..."
                  : stats?.totalBusinesses.toLocaleString() || "0"}
              </div>
              <div className="mt-2 text-blue-100">Businesses Listed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">
                {loading ? "..." : stats?.totalReviews.toLocaleString() || "0"}
              </div>
              <div className="mt-2 text-blue-100">Reviews Posted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">
                {loading
                  ? "..."
                  : `₦${(stats?.totalRewards || 0).toLocaleString()}`}
              </div>
              <div className="mt-2 text-blue-100">Rewards Paid</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Ready to Start Earning?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Join thousands of Nigerians who are already earning rewards by
              reviewing businesses.
            </p>
            <div className="mt-8">
              <Link href="/auth/signup">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg">
                  Create Your Account Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
