import type { BillingInvoice } from "@/types/billing";

const ALLOWED_STATUSES = new Set(["paid", "pending", "failed"]);

type BillingInvoiceRow = {
  id: string;
  userId: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: Date;
  paymentMethodId: string | null;
};

export function toBillingInvoice(row: BillingInvoiceRow): BillingInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    amountCents: row.amountCents,
    currency: row.currency,
    status: row.status,
    issuedAt: row.issuedAt.toISOString(),
    paymentMethodId: row.paymentMethodId,
  };
}

export function formatInvoiceAmount(cents: number, currency: string) {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatInvoiceDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function normalizeInvoiceNumber(value: string) {
  return value.trim();
}

export function validateInvoiceNumber(invoiceNumber: string) {
  if (!invoiceNumber) {
    return "invoiceNumber is required";
  }
  if (invoiceNumber.length > 64) {
    return "invoiceNumber must be 64 characters or fewer";
  }
  return null;
}

export function validateAmountCents(amountCents: number) {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    return "amountCents must be a non-negative integer";
  }
  return null;
}

export function validateInvoiceStatus(status: string) {
  if (!ALLOWED_STATUSES.has(status)) {
    return "status must be paid, pending, or failed";
  }
  return null;
}

export function validateCurrency(currency: string) {
  if (!/^[A-Z]{3}$/.test(currency)) {
    return "currency must be a 3-letter ISO code";
  }
  return null;
}
