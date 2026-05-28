import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://surftimeca.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SurfTime — California Surf Conditions",
  description:
    "Live surf conditions for 20 breaks from San Diego to San Francisco. Scores, wind, tide, and time-of-day forecasts updated daily.",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SurfTime — California Surf Conditions",
    description:
      "Live surf conditions for 20 breaks from San Diego to San Francisco. Scores, wind, tide, and time-of-day forecasts updated daily.",
    url: siteUrl,
    siteName: "SurfTime",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SurfTime — California Surf Conditions",
    description:
      "Live surf conditions for 20 breaks from San Diego to San Francisco. Scores, wind, tide, and time-of-day forecasts updated daily.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050a14]">
        {/* Ambient ocean gradient blobs — fixed, behind all content */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-48 left-1/4 w-[600px] h-[500px] rounded-full bg-teal-500/[0.045] blur-[140px]" />
          <div className="absolute -top-24 right-0 w-[450px] h-[400px] rounded-full bg-blue-700/[0.055] blur-[120px]" />
          <div className="absolute bottom-1/3 -left-24 w-[350px] h-[350px] rounded-full bg-cyan-600/[0.03] blur-[100px]" />
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
