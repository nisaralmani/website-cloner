import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import { appPageMetadata } from "@/lib/seo-metadata";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

// App inbox keeps Inter — marketing routes use Bybelt Aeonik Pro (see bybelt-fonts.css).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  manifest: "/seo/site.webmanifest",
  ...appPageMetadata("Inbox", "Bybelt shared inbox"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
