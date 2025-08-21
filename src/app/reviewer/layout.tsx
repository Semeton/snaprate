import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

interface ReviewerLayoutProps {
  children: ReactNode;
}

export default async function ReviewerLayout({
  children,
}: ReviewerLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "REVIEWER") {
    redirect("/dashboard");
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
