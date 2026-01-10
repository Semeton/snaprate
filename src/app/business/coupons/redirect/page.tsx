"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CouponRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the simplified version
    router.replace("/business/coupons/simple");
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Redirecting to simplified coupon management...
        </p>
      </div>
    </div>
  );
}
