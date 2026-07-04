"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { BillingInvoice } from "@/types/billing";
import { formatInvoiceAmount, formatInvoiceDate } from "@/lib/billing/invoices";
import { BillingInvoiceModal } from "@/components/settings/BillingInvoiceModal";

type BillingInvoicesPanelProps = {
  invoices: BillingInvoice[];
  emptyTitle: string;
  emptyDescription: string;
  creating?: boolean;
  onCreateInvoice?: () => void | Promise<void>;
  onInvoiceDeleted?: () => void;
};

function statusClassName(status: string) {
  if (status === "paid") {
    return "bg-[#EBF6ED] text-[#39A746]";
  }
  if (status === "pending") {
    return "bg-[#FFF5CC] text-[#B8860B]";
  }
  return "bg-[#FDECEC] text-[#D64545]";
}

export function BillingInvoicesPanel({
  invoices,
  emptyTitle,
  emptyDescription,
  creating = false,
  onCreateInvoice,
  onInvoiceDeleted,
}: BillingInvoicesPanelProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);

  if (invoices.length === 0) {
    return (
      <div className="mt-[45px] flex flex-col items-center px-[50px] text-center">
        <p className="mb-2.5 text-base font-extrabold leading-[26px] text-[#1c293b]">
          {emptyTitle}
        </p>
        <p className="mb-5 text-sm leading-[22px] text-[#75869c]">{emptyDescription}</p>
        {onCreateInvoice ? (
          <button
            type="button"
            disabled={creating}
            onClick={() => void onCreateInvoice()}
            className="inline-flex h-9 items-center gap-1.5 rounded border border-black/10 bg-[#1972F5] px-4 text-[13px] font-bold text-white disabled:opacity-60"
          >
            <Plus size={14} strokeWidth={2.5} />
            {creating ? "Generating…" : "Generate sample invoice"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {onCreateInvoice ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={creating}
            onClick={() => void onCreateInvoice()}
            className="inline-flex h-9 items-center gap-1.5 rounded border border-black/10 bg-white px-3 text-[13px] font-bold text-[#1c293b] disabled:opacity-60"
          >
            <Plus size={14} strokeWidth={2.5} />
            {creating ? "Generating…" : "Generate invoice"}
          </button>
        </div>
      ) : null}
      <div className="mt-6 overflow-hidden rounded-lg border border-[#E8EAEB] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E8EAEB] bg-[#F9FAFB] text-xs font-bold uppercase tracking-wide text-[#75869c]">
            <tr>
              <th className="px-4 py-3 font-bold">Date</th>
              <th className="px-4 py-3 font-bold">Invoice</th>
              <th className="px-4 py-3 font-bold">Amount</th>
              <th className="px-4 py-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="cursor-pointer border-b border-[#E8EAEB] last:border-b-0 hover:bg-[#F9FAFB]"
                onClick={() => setSelectedInvoice(invoice)}
              >
                <td className="px-4 py-4 text-[#1c293b]">{formatInvoiceDate(invoice.issuedAt)}</td>
                <td className="px-4 py-4 font-bold text-[#1c293b]">{invoice.invoiceNumber}</td>
                <td className="px-4 py-4 text-[#1c293b]">
                  {formatInvoiceAmount(invoice.amountCents, invoice.currency)}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold capitalize ${statusClassName(invoice.status)}`}
                  >
                    {invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BillingInvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onDeleted={onInvoiceDeleted}
      />
    </>
  );
}
