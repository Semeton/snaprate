"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Business {
  id: string;
  name: string;
  description?: string;
  category: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  isActive: boolean;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

export default function DebugBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllBusinesses();
  }, []);

  const fetchAllBusinesses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/businesses/all");
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
      } else {
        setError("Failed to fetch businesses");
      }
    } catch (error) {
      setError("Error fetching businesses");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading businesses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchAllBusinesses}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            All Registered Businesses
          </h1>
          <p className="text-gray-600">
            Total: {businesses.length} businesses found
          </p>
        </div>

        {businesses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No businesses found
              </h3>
              <p className="text-gray-600">
                There are no businesses registered in the system yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <Card
                key={business.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{business.name}</span>
                    <Badge
                      variant={business.isActive ? "default" : "secondary"}
                    >
                      {business.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{business.category}</p>
                    </div>

                    {business.description && (
                      <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="text-sm">{business.description}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-500">Contact</p>
                      <p className="text-sm">{business.phone}</p>
                      <p className="text-sm">{business.email}</p>
                      {business.website && (
                        <p className="text-sm text-blue-600">
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {business.website}
                          </a>
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="text-sm">
                        {business.address}, {business.city}, {business.state}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Owner</p>
                      <p className="text-sm">{business.owner.name}</p>
                      <p className="text-sm text-gray-600">
                        {business.owner.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Registered</p>
                      <p className="text-sm">
                        {new Date(business.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
