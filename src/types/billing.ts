export type WorkspacePlan = {
  workspaceId: string;
  name: string;
  avatarUrl: string | null;
  planTag: string;
  amount: string;
  period: string;
  status: string;
  billingOwner: string;
};

export type PaymentMethod = {
  id: string;
  label: string;
  last4: string;
  brand: string;
  createdAt: string;
};

export type BillingPlansPayload = {
  monthlyTotalCents: number;
  hasPaymentMethod: boolean;
  plans: WorkspacePlan[];
};

export type BillingCardsPayload = {
  cards: PaymentMethod[];
};

export type BillingInvoice = {
  id: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: string;
  paymentMethodId: string | null;
};

export type BillingInvoicesPayload = {
  invoices: BillingInvoice[];
};

export type WorkspaceBillingPayload = {
  paymentMethodId: string | null;
  cards: PaymentMethod[];
  selectedCard: PaymentMethod | null;
};
