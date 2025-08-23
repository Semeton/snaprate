"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { MessageSquare, Search, Filter } from "lucide-react";

export default function AdminReviewsPage() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement reviews fetching
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reviews Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and moderate all platform reviews
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reviews Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Reviews management system is being implemented. This will allow
            admins to:
          </p>
          <ul className="mt-4 space-y-2 text-gray-600">
            <li>• View all platform reviews</li>
            <li>• Approve or reject pending reviews</li>
            <li>• Moderate inappropriate content</li>
            <li>• Track review statistics and trends</li>
            <li>• Manage business responses to reviews</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
