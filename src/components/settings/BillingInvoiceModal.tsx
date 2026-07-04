"use client";

import { useState } from "react";
import type { BillingInvoice } from "@/types/billing";
import { formatInvoiceAmount, formatInvoiceDate } from "@/lib/billing/invoices";

type BillingInvoiceModalProps = {
  invoice: BillingInvoice | null;
  onClose: () => void;
  onDeleted?: () => void;
};

export function BillingInvoiceModal({
  invoice,
  onClose,
  onDeleted,
}: BillingInvoiceModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!invoice) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete invoice");
      }
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete invoice.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E8EAEB] px-5 py-4">
          <h2 className="text-base font-semibold text-[#1C293B]">Invoice Details</h2>
          <button type="button" onClick={onClose} className="text-[#828EA1]" aria-label="Close">
            ×
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm">
          {error ? <p className="text-[#EF4444]">{error}</p> : null}
          <div>
            <p className="text-xs font-semibold uppercase text-[#75869C]">Invoice Number</p>
            <p className="font-bold text-[#1C293B]">{invoice.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#75869C]">Date</p>
            <p className="text-[#1C293B]">{formatInvoiceDate(invoice.issuedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#75869C]">Amount</p>
            <p className="text-[#1C293B]">
              {formatInvoiceAmount(invoice.amountCents, invoice.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#75869C]">Status</p>
            <p className="capitalize text-[#1C293B]">{invoice.status}</p>
          </div>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="rounded border border-[#FECACA] px-4 py-2 text-sm font-semibold text-[#EF4444] disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
