import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://d3stats.xyz"),
  title: {
    template: "%s | D3Stats",
    default: "D3Stats | Analytics Dashboard for Doma Protocol",
  },
  description:
    "D3Stats is a real-time analytics service for Doma Protocol. Chain statistics, domain token explorer, wallet scoring, network health monitoring and more - all in one dashboard.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "D3Stats - Analytics & Data for Doma Protocol",
    description:
      "Track Doma chain activity, explore 400+ domain tokens, score any wallet, compare domains and monitor network health. Built for the Doma ecosystem.",
    type: "website",
    siteName: "D3Stats",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "D3Stats - Doma Protocol Analytics Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "D3Stats - Analytics & Data for Doma Protocol",
    description:
      "Track Doma chain activity, explore domain tokens, score wallets. Real-time analytics for the Doma ecosystem.",
    creator: "@MaxWayld",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="font-sans bg-bg-primary text-text-primary antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
