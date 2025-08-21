"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, Search, MapPin, Phone, Globe, ArrowLeft, Plus } from "lucide-react";

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  averageRating: number;
  totalReviews: number;
  logo: string;
}

export default function BusinessesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedState, setSelectedState] = useState(searchParams.get("state") || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasReviewed, setHasReviewed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchBusinesses();
      fetchUserReviews();
    }
  }, [session, status, searchQuery, selectedCategory, selectedState, currentPage]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
      });
      
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedState) params.append("state", selectedState);

      const response = await fetch(`/api/businesses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?userId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        const reviewedBusinessIds = new Set(data.data?.map((r: any) => r.businessId) || []);
        setHasReviewed(reviewedBusinessIds);
      }
    } catch (error) {
      console.error("Failed to fetch user reviews:", error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedState) params.append("state", selectedState);
    
    router.push(`/reviewer/businesses?${params.toString()}`);
  };

  const handleSubmitReview = (businessId: string) => {
    router.push(`/reviewer/submit-review?businessId=${businessId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading businesses...</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Find Businesses</h1>
              <p className="text-gray-600">Discover and review businesses to earn rewards</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Business name, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                    <SelectItem value="EDUCATION">Education</SelectItem>
                    <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
                    <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                    <SelectItem value="AUTOMOTIVE">Automotive</SelectItem>
                    <SelectItem value="BEAUTY">Beauty</SelectItem>
                    <SelectItem value="FITNESS">Fitness</SelectItem>
                    <SelectItem value="TRAVEL">Travel</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All states</SelectItem>
                    <SelectItem value="LAGOS">Lagos</SelectItem>
                    <SelectItem value="ABUJA">Abuja</SelectItem>
                    <SelectItem value="KANO">Kano</SelectItem>
                    <SelectItem value="RIVERS">Rivers</SelectItem>
                    <SelectItem value="KADUNA">Kaduna</SelectItem>
                    <SelectItem value="BAUCHI">Bauchi</SelectItem>
                    <SelectItem value="JIGAWA">Jigawa</SelectItem>
                    <SelectItem value="ANAMBRA">Anambra</SelectItem>
                    <SelectItem value="ENUGU">Enugu</SelectItem>
                    <SelectItem value="DELTA">Delta</SelectItem>
                    <SelectItem value="OGUN">Ogun</SelectItem>
                    <SelectItem value="OYO">Oyo</SelectItem>
                    <SelectItem value="OSUN">Osun</SelectItem>
                    <SelectItem value="ONDO">Ondo</SelectItem>
                    <SelectItem value="PLATEAU">Plateau</SelectItem>
                    <SelectItem value="BORNO">Borno</SelectItem>
                    <SelectItem value="ADAMAWA">Adamawa</SelectItem>
                    <SelectItem value="TARABA">Taraba</SelectItem>
                    <SelectItem value="YOBE">Yobe</SelectItem>
                    <SelectItem value="ZAMFARA">Zamfara</SelectItem>
                    <SelectItem value="KEBBI">Kebbi</SelectItem>
                    <SelectItem value="SOKOTO">Sokoto</SelectItem>
                    <SelectItem value="KATSINA">Katsina</SelectItem>
                    <SelectItem value="KOGI">Kogi</SelectItem>
                    <SelectItem value="KWARA">Kwara</SelectItem>
                    <SelectItem value="NASARAWA">Nasarawa</SelectItem>
                    <SelectItem value="NIGER">Niger</SelectItem>
                    <SelectItem value="BENUE">Benue</SelectItem>
                    <SelectItem value="CROSS_RIVER">Cross River</SelectItem>
                    <SelectItem value="AKWA_IBOM">Akwa Ibom</SelectItem>
                    <SelectItem value="BAYELSA">Bayelsa</SelectItem>
                    <SelectItem value="EBONYI">Ebonyi</SelectItem>
                    <SelectItem value="IMO">Imo</SelectItem>
                    <SelectItem value="ABIA">Abia</SelectItem>
                    <SelectItem value="EDO">Edo</SelectItem>
                    <SelectItem value="EKITI">Ekiti</SelectItem>
                    <SelectItem value="GOMBE">Gombe</SelectItem>
                    <SelectItem value="FCT">FCT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {loading ? "Loading..." : `${businesses.length} businesses found`}
          </p>
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* Businesses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : businesses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {businesses.map((business) => (
                <Card key={business.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Business Logo/Image */}
                    <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      {business.logo ? (
                        <img
                          src={business.logo}
                          alt={business.name}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-gray-400 text-4xl font-bold">
                          {business.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Business Info */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {business.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {business.description || "No description available"}
                      </p>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge variant="secondary">
                          {business.category.replace(/_/g, " ")}
                        </Badge>
                        {business.averageRating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">
                              {business.averageRating.toFixed(1)} ({business.totalReviews})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{business.address}, {business.city}, {business.state}</span>
                        </div>
                        {business.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{business.phone}</span>
                          </div>
                        )}
                        {business.website && (
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4" />
                            <span className="truncate">{business.website}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleSubmitReview(business.id)}
                      disabled={hasReviewed.has(business.id)}
                      className={`w-full ${
                        hasReviewed.has(business.id)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {hasReviewed.has(business.id) ? (
                        "Already Reviewed"
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Review & Earn ₦50
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    );
                  } else if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return <span key={page} className="px-3 py-2">...</span>;
                  }
                  return null;
                })}
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or browse all businesses
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                  setSelectedState("");
                  setCurrentPage(1);
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
