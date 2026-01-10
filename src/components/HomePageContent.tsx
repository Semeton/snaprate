"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Shield,
  CheckCircle,
  Heart,
  Star,
  MapPin,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  Play,
  Globe,
  Zap,
  Sparkles,
} from "lucide-react";

export default function HomePageContent() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/auth/signin");
  };

  const handleGetStarted = () => {
    router.push("/auth/signup");
  };

  const handleStartEarning = () => {
    router.push("/auth/signup");
  };

  const handleWatchDemo = () => {
    setIsVideoPlaying(!isVideoPlaying);
    // You can add actual video functionality here
  };

  const handleBrowseBusinesses = () => {
    router.push("/businesses");
  };

  const handleViewDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="apple-container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl apple-gradient flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold apple-text-gradient">
                SnapRate
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="apple-text-muted hover:text-gray-900 dark:hover:text-white apple-transition"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="apple-text-muted hover:text-gray-900 dark:hover:text-white apple-transition"
              >
                How It Works
              </a>
              <a
                href="#businesses"
                className="apple-text-muted hover:text-gray-900 dark:hover:text-white apple-transition"
              >
                Businesses
              </a>
              <a
                href="#about"
                className="apple-text-muted hover:text-gray-900 dark:hover:text-white apple-transition"
              >
                About
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="apple-text-muted hover:text-gray-900 dark:hover:text-white"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
              <Button
                className="apple-button rounded-xl px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="apple-section pt-32">
        <div className="apple-container">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="apple-badge apple-badge-primary mb-6 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Revolutionizing Business Reviews
            </Badge>

            <h1 className="apple-responsive-heading font-bold mb-6">
              Discover, Review, and{" "}
              <span className="apple-text-gradient">Earn Rewards</span>
            </h1>

            <p className="apple-responsive-text apple-text-muted mb-8 max-w-2xl mx-auto">
              Join thousands of users who are earning money while helping
              businesses grow. Share your experiences and get rewarded for every
              review you submit.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                className="apple-button rounded-xl px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={handleStartEarning}
              >
                Start Earning Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="apple-button rounded-xl px-8 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500"
                onClick={handleWatchDemo}
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm apple-text-muted">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Secure & Verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <span>Instant Rewards</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span>Community Driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="apple-section bg-white dark:bg-gray-900">
        <div className="apple-container">
          <div className="apple-grid-4">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold apple-text-gradient mb-2">
                50K+
              </div>
              <div className="apple-text-muted">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold apple-text-gradient mb-2">
                ₦2.5M+
              </div>
              <div className="apple-text-muted">Rewards Paid</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold apple-text-gradient mb-2">
                1.2K+
              </div>
              <div className="apple-text-muted">Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold apple-text-gradient mb-2">
                15K+
              </div>
              <div className="apple-text-muted">Reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="apple-section">
        <div className="apple-container">
          <div className="text-center mb-16">
            <h2 className="apple-responsive-heading font-bold mb-4">
              How <span className="apple-text-gradient">SnapRate</span> Works
            </h2>
            <p className="apple-responsive-text apple-text-muted max-w-2xl mx-auto">
              Get started in three simple steps and start earning rewards for
              your reviews
            </p>
          </div>

          <div className="apple-grid-3">
            <Card className="apple-card p-8 text-center group">
              <div className="w-16 h-16 rounded-2xl apple-gradient flex items-center justify-center mx-auto mb-6 group-hover:scale-110 apple-transition">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Find Businesses</h3>
              <p className="apple-text-muted">
                Discover local businesses in your area or search for specific
                categories
              </p>
            </Card>

            <Card className="apple-card p-8 text-center group">
              <div className="w-16 h-16 rounded-2xl apple-gradient-secondary flex items-center justify-center mx-auto mb-6 group-hover:scale-110 apple-transition">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Write Reviews</h3>
              <p className="apple-text-muted">
                Share your honest experiences with photos and videos to earn
                rewards
              </p>
            </Card>

            <Card className="apple-card p-8 text-center group">
              <div className="w-16 h-16 rounded-2xl apple-gradient-success flex items-center justify-center mx-auto mb-6 group-hover:scale-110 apple-transition">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Rewarded</h3>
              <p className="apple-text-muted">
                Earn ₦50 for each approved review and unlock bonus rewards
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="apple-section bg-gray-50 dark:bg-gray-800/50">
        <div className="apple-container">
          <div className="text-center mb-16">
            <h2 className="apple-responsive-heading font-bold mb-4">
              Popular <span className="apple-text-gradient">Categories</span>
            </h2>
            <p className="apple-responsive-text apple-text-muted max-w-2xl mx-auto">
              Explore businesses across various industries and start reviewing
            </p>
          </div>

          <div className="apple-grid-4">
            {[
              {
                name: "Restaurants",
                icon: "🍽️",
                count: "450+",
                color: "from-orange-400 to-red-500",
              },
              {
                name: "Shopping",
                icon: "🛍️",
                count: "320+",
                color: "from-pink-400 to-purple-500",
              },
              {
                name: "Healthcare",
                icon: "🏥",
                count: "180+",
                color: "from-blue-400 to-cyan-500",
              },
              {
                name: "Entertainment",
                icon: "🎬",
                count: "220+",
                color: "from-green-400 to-teal-500",
              },
            ].map((category, index) => (
              <Card
                key={index}
                className="apple-card p-6 text-center group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mx-auto mb-4 text-2xl group-hover:scale-110 apple-transition`}
                >
                  {category.icon}
                </div>
                <h3 className="font-semibold mb-2">{category.name}</h3>
                <p className="text-sm apple-text-muted">
                  {category.count} businesses
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Impact */}
      <section className="apple-section">
        <div className="apple-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="apple-responsive-heading font-bold mb-6">
                Building a{" "}
                <span className="apple-text-gradient">Better Business</span>{" "}
                Ecosystem
              </h2>
              <p className="apple-responsive-text apple-text-muted mb-8">
                SnapRate connects consumers with businesses, creating a
                transparent marketplace where honest feedback drives growth and
                innovation.
              </p>

              <div className="space-y-4">
                {[
                  "Real-time business insights and analytics",
                  "Verified customer reviews and ratings",
                  "Automated reward distribution system",
                  "Community-driven business recommendations",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="apple-text-emphasis">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card className="apple-card p-8">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl apple-gradient flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Platform Growth</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="apple-text-muted">
                        Monthly Active Users
                      </span>
                      <span className="font-semibold">+45%</span>
                    </div>
                    <div className="apple-progress">
                      <div
                        className="apple-progress-bar"
                        style={{ width: "75%" }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="apple-text-muted">
                        Business Onboarding
                      </span>
                      <span className="font-semibold">+32%</span>
                    </div>
                    <div className="apple-progress">
                      <div
                        className="apple-progress-bar"
                        style={{ width: "60%" }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="apple-text-muted">Review Quality</span>
                      <span className="font-semibold">+28%</span>
                    </div>
                    <div className="apple-progress">
                      <div
                        className="apple-progress-bar"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="apple-section bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="apple-container text-center">
          <h2 className="apple-responsive-heading font-bold text-white mb-6">
            Ready to Start Earning?
          </h2>
          <p className="apple-responsive-text text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already earning rewards while
            helping businesses grow. Sign up today and get your first reward
            within minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              className="apple-button rounded-xl px-8 py-4 text-lg bg-white text-blue-600 hover:bg-gray-100"
              onClick={handleStartEarning}
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="apple-button rounded-xl px-8 py-4 text-lg border-2 border-white/30 text-white hover:bg-white/10"
              onClick={() => router.push("/businesses")}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="apple-container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-xl apple-gradient flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">SnapRate</span>
              </div>
              <p className="apple-text-muted text-gray-400 mb-4">
                Connecting consumers with businesses through honest reviews and
                rewards.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gray-700 apple-transition cursor-pointer">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gray-700 apple-transition cursor-pointer">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    Rewards
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    Businesses
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white apple-transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="apple-divider border-gray-800"></div>

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 SnapRate. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-4 md:mt-0">
              Made with ❤️ for the Nigerian business community
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
