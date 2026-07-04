import { formatShopifyCustomerName } from "./shopify-customer-fields.server";
import {
  formatShopifyCustomerAccessError,
  isProtectedCustomerDataError,
  shopifyGraphqlErrorMessage,
} from "./shopify-graphql-errors.server";

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export type ShopifyContactInput = {
  name: string;
  email: string;
  location?: string;
  company?: string;
};

type CustomerNode = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  defaultAddress?: { city?: string | null; country?: string | null } | null;
};

const CUSTOMERS_FULL_QUERY = `#graphql
  query BybeltCustomersPage($first: Int!, $after: String) {
    customers(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        firstName
        lastName
        email
        defaultAddress {
          city
          country
        }
      }
    }
  }
`;

const CUSTOMERS_EMAIL_QUERY = `#graphql
  query BybeltCustomersEmailPage($first: Int!, $after: String) {
    customers(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        email
      }
    }
  }
`;

const PAGE_SIZE = 100;
const MAX_CUSTOMERS = 500;

function toContactInput(node: CustomerNode): ShopifyContactInput | null {
  const email = node.email?.trim().toLowerCase();
  if (!email) return null;

  const location = node.defaultAddress
    ? [node.defaultAddress.city, node.defaultAddress.country].filter(Boolean).join(", ")
    : undefined;

  return {
    name: formatShopifyCustomerName(node.firstName, node.lastName, email),
    email,
    location: location || undefined,
    company: "Shopify",
  };
}

type CustomersPage = {
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
  nodes?: CustomerNode[];
};

async function fetchCustomersPage(
  admin: AdminGraphql,
  query: string,
  first: number,
  after: string | null,
): Promise<CustomersPage> {
  try {
    const response = await admin.graphql(query, {
      variables: { first, after },
    });
    if (!response.ok) {
      throw new Error(`Shopify GraphQL ${response.status}`);
    }

    const json = (await response.json()) as {
      data?: { customers?: CustomersPage };
      errors?: Array<{ message?: string }>;
    };

    if (json.errors?.length) {
      const message = json.errors.map((error) => error.message).filter(Boolean).join("; ");
      throw new Error(message || "Shopify customer query failed");
    }

    return json.data?.customers ?? {};
  } catch (error) {
    throw error instanceof Error ? error : new Error(shopifyGraphqlErrorMessage(error));
  }
}

async function paginateCustomers(
  admin: AdminGraphql,
  query: string,
): Promise<ShopifyContactInput[]> {
  const customers: ShopifyContactInput[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage && customers.length < MAX_CUSTOMERS) {
    const page = await fetchCustomersPage(
      admin,
      query,
      Math.min(PAGE_SIZE, MAX_CUSTOMERS - customers.length),
      cursor,
    );

    for (const node of page.nodes ?? []) {
      const contact = toContactInput(node);
      if (contact) customers.push(contact);
    }

    hasNextPage = Boolean(page.pageInfo?.hasNextPage);
    cursor = page.pageInfo?.endCursor ?? null;
    if (!cursor) hasNextPage = false;
  }

  return customers;
}

export async function listShopifyCustomersForSync(
  admin: AdminGraphql,
): Promise<ShopifyContactInput[]> {
  try {
    return await paginateCustomers(admin, CUSTOMERS_FULL_QUERY);
  } catch (error) {
    const message = shopifyGraphqlErrorMessage(error);
    if (!isProtectedCustomerDataError(message)) {
      throw error instanceof Error ? error : new Error(message);
    }
  }

  try {
    return await paginateCustomers(admin, CUSTOMERS_EMAIL_QUERY);
  } catch (error) {
    throw new Error(
      formatShopifyCustomerAccessError(shopifyGraphqlErrorMessage(error)),
    );
  }
}
