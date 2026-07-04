import type { Metadata } from "next";

import { BRAND_NAME } from "@/lib/brand";

const SITE_NAME = BRAND_NAME;

export const bybeltIcons: Metadata["icons"] = {
  icon: [
    { url: "/seo/favicon.ico" },
    { url: "/seo/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "/seo/favicon-512x512.png", sizes: "512x512", type: "image/png" },
  ],
  apple: "/seo/apple-touch-icon.png",
};

export function marketingPageMetadata(
  title: string,
  description: string,
): Metadata {
  return {
    title,
    description,
    icons: bybeltIcons,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en",
      title,
      description,
      images: [{ url: "/seo/og-en.png", width: 1200, height: 600, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/seo/og-en.png"],
    },
  };
}

export function marketingMetadata(): Metadata {
  const title = "Bybelt — AI Customer Support Platform";
  const description =
    "Unify inbox, AI agents, live chat, and analytics in one workspace. Support every customer, scale without limits.";

  return {
    title,
    description,
    icons: bybeltIcons,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en",
      title,
      description,
      images: [
        {
          url: "/seo/og-en.png",
          width: 1200,
          height: 600,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/seo/og-en.png"],
    },
  };
}

export function loginMetadata(): Metadata {
  const description =
    "Login to your Bybelt account to access your Bybelt Inbox.";

  return {
    title: SITE_NAME,
    description,
    icons: bybeltIcons,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      images: [{ url: "/seo/og-en.png", width: 1200, height: 600 }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description,
      images: ["/seo/og-en.png"],
    },
  };
}

export function appPageMetadata(title: string, description?: string): Metadata {
  const pageTitle = `${title} | ${SITE_NAME}`;

  return {
    title: pageTitle,
    description: description ?? `${SITE_NAME} ${title.toLowerCase()}`,
    icons: bybeltIcons,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: pageTitle,
      images: [{ url: "/seo/og-en.png", width: 1200, height: 600 }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      images: ["/seo/og-en.png"],
    },
  };
}
