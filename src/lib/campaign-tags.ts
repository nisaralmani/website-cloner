export const DEFAULT_CAMPAIGN_TAGS = [
  "newsletter",
  "promo",
  "onboarding",
  "vip",
  "re-engagement",
  "product-launch",
] as const;

export function filterCampaignTags(tags: readonly string[], query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...tags];
  return tags.filter((tag) => tag.toLowerCase().includes(normalized));
}
