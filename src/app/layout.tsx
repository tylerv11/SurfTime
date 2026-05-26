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
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
