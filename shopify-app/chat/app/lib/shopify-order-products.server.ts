export function formatShopifyOrderProducts(
  lineItems?: Array<{ name?: string | null; quantity?: number | null }> | null,
): string | undefined {
  const parts = (lineItems ?? [])
    .map((item) => {
      const name = item.name?.trim();
      if (!name) return null;
      const quantity = item.quantity ?? 1;
      return quantity > 1 ? `${quantity}× ${name}` : name;
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 5);

  return parts.length > 0 ? parts.join(", ").slice(0, 500) : undefined;
}
