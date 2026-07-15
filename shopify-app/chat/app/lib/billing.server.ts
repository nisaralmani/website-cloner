import { shopifyGraphqlErrorMessage } from "./shopify-graphql-errors.server";

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

/**
 * Shopify-managed billing catalog. The subscription `name` is the plan tag, so
 * the `app_subscriptions/update` webhook can reverse-map name -> tag when it
 * writes the plan into the main app. Prices and tags mirror the main app's
 * source-of-truth (`src/lib/billing/*`).
 */
export type PaidPlanTag = "Essentials" | "Plus" | "Pro";
export type PlanTag = "Free" | PaidPlanTag;

export const BILLING_PLANS: Record<PaidPlanTag, { name: PaidPlanTag; amountUsd: number }> = {
  Essentials: { name: "Essentials", amountUsd: 25 },
  Plus: { name: "Plus", amountUsd: 95 },
  Pro: { name: "Pro", amountUsd: 250 },
};

export function isPaidPlanTag(tag: string): tag is PaidPlanTag {
  return tag === "Essentials" || tag === "Plus" || tag === "Pro";
}

/** Reverse-map a Shopify subscription name back to a plan tag. */
export function planTagFromSubscriptionName(name: string | null | undefined): PlanTag {
  const trimmed = name?.trim();
  if (trimmed && isPaidPlanTag(trimmed)) return trimmed;
  return "Free";
}

/** Test charges everywhere except production so dev/staging never bills a real card. */
function isTestCharge(): boolean {
  return process.env.NODE_ENV !== "production";
}

const CREATE_SUBSCRIPTION_MUTATION = `#graphql
  mutation BybeltAppSubscriptionCreate(
    $name: String!
    $returnUrl: URL!
    $test: Boolean!
    $lineItems: [AppSubscriptionLineItemInput!]!
  ) {
    appSubscriptionCreate(name: $name, returnUrl: $returnUrl, test: $test, lineItems: $lineItems) {
      confirmationUrl
      appSubscription {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ACTIVE_SUBSCRIPTIONS_QUERY = `#graphql
  query BybeltActiveSubscriptions {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
      }
    }
  }
`;

const CANCEL_SUBSCRIPTION_MUTATION = `#graphql
  mutation BybeltAppSubscriptionCancel($id: ID!) {
    appSubscriptionCancel(id: $id) {
      appSubscription {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export type ActiveSubscription = {
  id: string;
  name: string;
  status: string;
};

async function graphqlJson<T>(
  admin: AdminGraphql,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await admin.graphql(query, variables ? { variables } : undefined);
  if (!response.ok) {
    throw new Error(`Shopify GraphQL ${response.status}`);
  }
  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };
  if (json.errors?.length) {
    const message = json.errors.map((error) => error.message).filter(Boolean).join("; ");
    throw new Error(message || "Shopify billing query failed");
  }
  return json.data as T;
}

/**
 * Create a recurring app subscription. Returns Shopify's confirmation URL, which
 * the merchant is redirected to in order to approve the charge.
 */
export async function createAppSubscription(
  admin: AdminGraphql,
  options: { planTag: PaidPlanTag; returnUrl: string },
): Promise<{ confirmationUrl: string }> {
  const plan = BILLING_PLANS[options.planTag];

  const data = await graphqlJson<{
    appSubscriptionCreate?: {
      confirmationUrl?: string | null;
      userErrors?: Array<{ field?: string[] | null; message?: string }>;
    };
  }>(admin, CREATE_SUBSCRIPTION_MUTATION, {
    name: plan.name,
    returnUrl: options.returnUrl,
    test: isTestCharge(),
    lineItems: [
      {
        plan: {
          appRecurringPricingDetails: {
            price: { amount: plan.amountUsd, currencyCode: "USD" },
            interval: "EVERY_30_DAYS",
          },
        },
      },
    ],
  });

  const result = data.appSubscriptionCreate;
  const userErrors = result?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(
      userErrors.map((error) => error.message).filter(Boolean).join("; ") ||
        "Shopify rejected the subscription request",
    );
  }
  const confirmationUrl = result?.confirmationUrl?.trim();
  if (!confirmationUrl) {
    throw new Error("Shopify did not return a confirmation URL");
  }
  return { confirmationUrl };
}

export async function getActiveSubscriptions(admin: AdminGraphql): Promise<ActiveSubscription[]> {
  try {
    const data = await graphqlJson<{
      currentAppInstallation?: { activeSubscriptions?: ActiveSubscription[] };
    }>(admin, ACTIVE_SUBSCRIPTIONS_QUERY);
    return data.currentAppInstallation?.activeSubscriptions ?? [];
  } catch (error) {
    throw error instanceof Error ? error : new Error(shopifyGraphqlErrorMessage(error));
  }
}

/** Cancel every active subscription — used when the merchant downgrades to Free. */
export async function cancelActiveSubscriptions(admin: AdminGraphql): Promise<number> {
  const active = await getActiveSubscriptions(admin);
  let cancelled = 0;
  for (const subscription of active) {
    const data = await graphqlJson<{
      appSubscriptionCancel?: {
        userErrors?: Array<{ field?: string[] | null; message?: string }>;
      };
    }>(admin, CANCEL_SUBSCRIPTION_MUTATION, { id: subscription.id });
    const userErrors = data.appSubscriptionCancel?.userErrors ?? [];
    if (userErrors.length > 0) {
      throw new Error(
        userErrors.map((error) => error.message).filter(Boolean).join("; ") ||
          "Shopify rejected the cancellation request",
      );
    }
    cancelled += 1;
  }
  return cancelled;
}
