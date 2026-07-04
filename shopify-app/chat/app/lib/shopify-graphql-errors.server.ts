const PCD_HINT =
  "Enable Name + Email under Protected customer data in Shopify Partners (Customer service / App functionality), then reinstall the app on your store.";

export function shopifyGraphqlErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const nested = (error as { errors?: { graphQLErrors?: Array<{ message?: string }> } }).errors;
    const graphMessages = nested?.graphQLErrors
      ?.map((entry) => entry.message?.trim())
      .filter(Boolean);
    if (graphMessages?.length) {
      return graphMessages.join("; ");
    }
  }

  return error instanceof Error ? error.message : String(error);
}

export function isProtectedCustomerDataError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("not approved") ||
    lower.includes("protected customer") ||
    lower.includes("customer data access") ||
    lower.includes("access denied")
  );
}

export function formatShopifyCustomerAccessError(message: string): string {
  if (isProtectedCustomerDataError(message)) {
    return `Shopify customer data access is not enabled for this app. ${PCD_HINT}`;
  }
  return message;
}
