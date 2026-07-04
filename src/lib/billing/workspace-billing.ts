export const WORKSPACE_BILLING_PAGE_SLUG = "workspace/billing";

export const WORKSPACE_BILLING_PAYMENT_METHOD_FIELD = "paymentMethodId";

export function workspaceBillingPaymentMethodKey() {
  return `${WORKSPACE_BILLING_PAGE_SLUG}::${WORKSPACE_BILLING_PAYMENT_METHOD_FIELD}`;
}
