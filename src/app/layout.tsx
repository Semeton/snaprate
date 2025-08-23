import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SnapRate - Review Businesses. Earn Money.",
  description:
    "Join thousands of Nigerians who are earning rewards by sharing authentic reviews of businesses. Get paid for your honest feedback and help others make informed decisions.",
  keywords: [
    "business reviews",
    "earn money",
    "Nigeria",
    "rewards",
    "coupons",
    "business ratings",
  ],
  authors: [{ name: "SnapRate Team" }],
  openGraph: {
    title: "SnapRate - Review Businesses. Earn Money.",
    description:
      "Join thousands of Nigerians who are earning rewards by sharing authentic reviews of businesses.",
    type: "website",
    locale: "en_NG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
