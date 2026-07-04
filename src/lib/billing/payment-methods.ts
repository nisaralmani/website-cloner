import type { PaymentMethod } from "@/types/billing";

const ALLOWED_BRANDS = new Set(["visa", "mastercard", "amex", "discover"]);

type PaymentMethodRow = {
  id: string;
  userId: string;
  label: string;
  last4: string;
  brand: string;
  createdAt: Date;
};

export function toPaymentMethod(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    label: row.label,
    last4: row.last4,
    brand: row.brand,
    createdAt: row.createdAt.toISOString(),
  };
}

export function formatPaymentMethodLabel(brand: string, last4: string) {
  const titleBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
  return `${titleBrand} ending in ${last4}`;
}

export function defaultMockPaymentMethod() {
  return {
    brand: "visa",
    last4: "4242",
    label: "Visa ending in 4242",
  };
}

export function normalizeBrand(value: string | undefined) {
  return (value ?? "visa").trim().toLowerCase();
}

export function normalizeLast4(value: string | undefined) {
  return (value ?? "4242").trim();
}

export function validateBrand(brand: string) {
  if (!ALLOWED_BRANDS.has(brand)) {
    return "brand must be visa, mastercard, amex, or discover";
  }
  return null;
}

export function validateLast4(last4: string) {
  if (!/^\d{4}$/.test(last4)) {
    return "last4 must be exactly 4 digits";
  }
  return null;
}

export function validateLabel(label: string) {
  if (!label.trim()) {
    return "label is required";
  }
  if (label.length > 120) {
    return "label must be 120 characters or fewer";
  }
  return null;
}
