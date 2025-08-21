"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { signIn, signOut } from "next-auth/react";

export default function TestAuthPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Authenticated!</h1>
          <p>Welcome, {session.user.name}!</p>
          <p>Role: {session.user.role}</p>
          <p>Status: {session.user.status}</p>
          <Button onClick={() => signOut()}>Sign Out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Not Authenticated</h1>
        <Button onClick={() => signIn()}>Sign In</Button>
      </div>
    </div>
  );
}
