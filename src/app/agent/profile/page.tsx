"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Building2, Award } from "lucide-react";

export default function AgentProfilePage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Agent Profile</h1>
          <p>Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Agent Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Name:</span>
                  <span>{session.user.name}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Email:</span>
                  <span>{session.user.email}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Status:</span>
                  <span className="text-green-600 font-medium">
                    Approved Agent
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full" variant="outline">
                  Update Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agent Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Agent Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Businesses Onboarded:</span>
                  <span>0</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Award className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Total Earnings:</span>
                  <span>₦0</span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Approval Rate:</span>
                  <span>0%</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full" variant="outline">
                  View Detailed Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
