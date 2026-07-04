export function formatShopifyCustomerName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined,
): string {
  const name = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  if (name) return name;
  const normalizedEmail = email?.trim();
  return normalizedEmail || "Shopify customer";
}
