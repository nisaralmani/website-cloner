type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

const ORDER_EMAIL_QUERY = `#graphql
  query BybeltOrderEmail($id: ID!) {
    order(id: $id) {
      name
      email
      customer {
        email
      }
    }
  }
`;

export async function fetchShopifyOrderContext(
  admin: AdminGraphql,
  orderId: number | string,
): Promise<{ email: string; orderName: string } | null> {
  const numericId = String(orderId).trim();
  if (!numericId) return null;

  const response = await admin.graphql(ORDER_EMAIL_QUERY, {
    variables: { id: `gid://shopify/Order/${numericId}` },
  });
  if (!response.ok) return null;

  const json = (await response.json()) as {
    data?: {
      order?: {
        name?: string | null;
        email?: string | null;
        customer?: { email?: string | null } | null;
      } | null;
    };
  };

  const order = json.data?.order;
  const email = (order?.customer?.email ?? order?.email)?.trim();
  const orderName = order?.name?.trim();
  if (!email || !orderName) return null;

  return { email, orderName };
}
