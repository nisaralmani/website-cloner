import { marketingHomeUrl } from "@/lib/marketing-paths";

/** Canonical site URL for metadata, sitemap, and OG tags. */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? marketingHomeUrl();
}
