export function isShopifyUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const response = (error as { response?: { code?: number } }).response;
  if (response?.code === 401) return true;

  const message = String((error as { message?: string }).message ?? "");
  return message.includes("401") || message.includes("Unauthorized");
}
